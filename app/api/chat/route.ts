import { NextResponse } from "next/server"
import { Configuration, OpenAIApi } from "openai"
import moment from "moment-timezone"
import axios from "axios"

// OpenAI設定
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

// URL
const WORLD_TIME_URL = "http://worldtimeapi.org/api/timezone"
const OPEN_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"

// 時刻取得
const getTime = async (location: string, name: string) => {
  try {
    // APIコール
    const response = await axios.get(`${WORLD_TIME_URL}/${location}`)
    // 時刻取得
    const { datetime } = response.data
    // 時刻フォーマット
    const dateTime = moment.tz(datetime, location).format("A HH:mm")

    return `${name}の時刻は${dateTime}です。`
  } catch (error) {
    return `${name}の時刻は分かりませんでした。`
  }
}

// 天気取得
const getWeather = async (location: string, name: string) => {
  try {
    // APIコール
    const response = await axios.get(OPEN_WEATHER_URL, {
      params: {
        q: location,
        appid: process.env.OPEN_WEATHER_API_KEY,
        units: "metric",
        lang: "ja",
      },
    })
    // 天気取得
    const description = response.data.weather[0].description
    // 気温取得
    const temp = response.data.main.temp

    return `${name}の天気は${description}で${temp}度です。`
  } catch (error) {
    return `${name}の天気は分かりませんでした。`
  }
}

// Function Calling設定
const functions = [
  {
    name: "getTime",
    description: "Get the current time for a specific location.",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description:
            "The specified location, for instance, Tokyo, Los Angeles, should be represented in the form of a timezone name such as Asia/Tokyo.",
        },
        name: {
          type: "string",
          description:
            "The location referred to in the prompt could be, for example, Tokyo, Los Angeles.",
        },
      },
      required: ["location", "name"],
    },
  },
  {
    name: "getWeather",
    description: "Get the current weather for a specific location.",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description:
            "The specified location, for instance, Tokyo, Los Angeles, should be identified by its geographical name.",
        },
        name: {
          type: "string",
          description:
            "The location referred to in the prompt could be, for example, Tokyo, Los Angeles.",
        },
      },
      required: ["location", "name"],
    },
  },
]

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages } = body

    // ChatGPT
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-0613",
      messages,
      functions,
      function_call: "auto",
    })

    // メッセージ取得
    const responseMessage = response.data.choices[0].message

    // メッセージ取得エラー
    if (!responseMessage) {
      return new NextResponse("Message Error", { status: 500 })
    }

    // 通常のメッセージ
    if (responseMessage.content) {
      return NextResponse.json(responseMessage)
    } else {
      // Function Callingチェック
      if (!responseMessage.function_call) {
        return new NextResponse("Function Call Error", { status: 500 })
      }

      // 引数チェック
      if (!responseMessage.function_call.arguments) {
        return new NextResponse("Function Call Arguments Error", {
          status: 500,
        })
      }

      // 関数名取得
      const functionCallName = responseMessage.function_call.name

      // 引数取得
      const functionCallNameArguments = JSON.parse(
        responseMessage.function_call.arguments
      )

      // メッセージ内容
      let content = ""

      // 関数名によって処理を分岐
      if (functionCallName === "getTime") {
        // 時刻取得
        content = await getTime(
          functionCallNameArguments.location,
          functionCallNameArguments.name
        )
      } else if (functionCallName === "getWeather") {
        // 天気取得
        content = await getWeather(
          functionCallNameArguments.location,
          functionCallNameArguments.name
        )
      } else {
        return new NextResponse("Function Call Name Error", { status: 500 })
      }

      // レスポンスのメッセージ作成
      const message = {
        role: "assistant",
        content,
      }

      return NextResponse.json(message)
    }
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}
