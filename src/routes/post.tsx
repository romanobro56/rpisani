import OpenAI from "openai"
import * as dotenv from 'dotenv'
import '../styles/post.css'

const post = () => {

  const getResponse = (e: MouseEvent) => {
    "use server"
    dotenv.config()
    const apiKey = process.env.OPENAI_API_KEY

    const openai = new OpenAI({apiKey})

    console.log(openai)
    return

  }



  return (
    <div>
          <header>
              <h1>AI Essay: The Role of AI in Humanity's Future</h1>
              <nav>
                  <ul>
                      <li><a href="#viewpoint1">Viewpoint 1: Sam Altman</a></li>
                      <li><a href="#viewpoint2">Viewpoint 2: Elon Musk</a></li>
                      <li><a href="#viewpoint3">Viewpoint 3: Lex Fridman</a></li>
                      <li><a href="#chatgpt">Ask ChatGPT</a></li>
                  </ul>
              </nav>
          </header>
          <section id="viewpoint1">
              <h2>Sam Altman on AI</h2>
              <p>AI can help us do better work, improve jobs, and enhance quality of life for most.</p>
              <blockquote>
                  "If this technology goes wrong, it can go quite wrong."
                  - Sam Altman, OpenAI CEO
              </blockquote>
              <p>Background: Sam Altman is the founder of OpenAI.</p>
              <p>Reference: <a href="reference url">Sam Altman testifies at Senate artificial intelligence hearing on 5/16/2023</a></p>
              <audio controls>
                  <source src="sam.mp3" type="audio/mpeg" />
                  Your browser does not support the audio element.
              </audio>
          </section>
          <section id="viewpoint2">
              <h2>Elon Musk on AI</h2>
              <p>If AI can do our job better than we can, we face new challenges that are best not considered now.</p>
              <blockquote>
                  Elon Musk discusses the implications of AI on his children's future in the workforce.
              </blockquote>
              <p>Background: Elon Musk is the founder of Tesla and is actively working on AI technologies.</p>
              <p>Reference: <a href="interview.url">Elon Musk interview with CNBC 5/16/2023</a></p>
              <audio controls>
                  <source src="elon.mp3" type="audio/mpeg" />
                  Your browser does not support the audio element.
              </audio>
          </section>
          <section id="viewpoint3">
              <h2>Lex Fridman on AI</h2>
              <p>AI can either create a dystopian society or empower humans to flourish.</p>
              <blockquote>
                  Lex Fridman discusses the dangers of AI.
              </blockquote>
              <p>Background: Lex Fridman is a research scientist at MIT.</p>
              <p>Reference: <a href="podcast.url">Lex Fridman podcast with Sam Altman preface</a></p>
              <audio controls>
                  <source src="lex.mp3" type="audio/mpeg" />
                  Your browser does not support the audio element.
              </audio>
          </section>
          <section id="chatgpt">
              <h2>Ask ChatGPT</h2>
              <p>Interact with ChatGPT to explore its views on the impact of AI on the workforce. Try asking about specific concepts.</p>
              <textarea id="userInput" placeholder="Type your question here..."></textarea>
              <button onClick={(event) => getResponse(event)}>Ask</button>
              <div id="gptResponse"></div>
          </section>
          <footer>
              <p>Works Cited</p>
              <ul>
                  <li>Sam Altman Senate Testimony, 2023</li>
                  <li>Elon Musk CNBC Interview, 2023</li>
                  <li>Lex Fridman Podcast, 2023</li>
              </ul>
          </footer>
    </div>
  )
}

export default post