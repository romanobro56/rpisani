import OpenAI from "openai"
import * as dotenv from 'dotenv'
import '../styles/post.css'

const post = () => {

  const getResponse = async (message: string) => {
    "use server"
    dotenv.config()

    const apiKey = process.env.OPENAI_API_KEY
    const openai = new OpenAI({apiKey})
   
    // const completion = await openai.chat.completions.create({
    //   messages: [{ role: "system", content: message }],
    //   model: "gpt-3.5-turbo",
    // });

    // return completion.choices[0].message.content
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
              <p>Source: <a target="_blank" href="https://www.youtube.com/watch?v=Pn-W41hC764">Sam Altman testifies at Senate artificial intelligence hearing on 5/16/2023</a></p>
              <audio controls>
                  <source src="sam.mp3" type="audio/mpeg" />
                  Your browser does not support the audio element.
              </audio>
          </section>
          <section id="viewpoint2">
              <h2>Elon Musk on AI</h2>
              <p>If AI can do our job better than we can, we face new challenges that are best not considered now.</p>
              <blockquote>
                  "To some extent I have to have some deliberate suspension of disbelief in order to remain motivated"
              </blockquote>
              <p>Background: Elon Musk is the founder of Tesla and is actively working on AI technologies.</p>
              <p>Source: <a target="_blank" href="https://www.youtube.com/watch?v=JJPWIiu-BUw">Elon Musk interview with CNBC 5/16/2023</a></p>
              <audio controls>
                  <source src="elon.mp3" type="audio/mpeg" />
                  Your browser does not support the audio element.
              </audio>
          </section>
          <section id="viewpoint3">
              <h2>Lex Fridman on AI</h2>
              <p>AI can either create a dystopian society or empower humans to flourish.</p>
              <blockquote>
                  "It is terrifying because of the power that superintelligent AGI wields that destroy human civilization intentionally or unintentionally"
              </blockquote>
              <p>Background: Lex Fridman is a research scientist at MIT.</p>
              <p>Source: <a target="_blank" href="https://www.youtube.com/watch?v=k7vcA91Ec-c">Lex Fridman podcast with Sam Altman preface</a></p>
              <audio controls>
                  <source src="lex.mp3" type="audio/mpeg" />
                  Your browser does not support the audio element.
              </audio>
          </section>
          <section id="chatgpt">
              <h2>Ask ChatGPT</h2>
              <button 
                id="suggestedQuestion1" 
                onClick={(event) => {
                  const thisQuestion = document.getElementById("suggestedQuestion1") as HTMLInputElement
                  const userInput = document.getElementById("userInput") as HTMLInputElement
                  userInput.value = thisQuestion.innerHTML
                }}
              >
                How can we ensure that the deployment of AI in workplaces adheres to ethical standards, and who should be responsible for this oversight?
              </button>
              <button 
                id="suggestedQuestion2" 
                onClick={(event) => {
                  const thisQuestion = document.getElementById("suggestedQuestion2") as HTMLInputElement
                  const userInput = document.getElementById("userInput") as HTMLInputElement
                  userInput.value = thisQuestion.innerHTML
                }}
              >
                While AI may streamline processes and improve efficiency, resulting in job displacement, what new types of jobs might it create? How can workers be retrained for these new roles?
              </button>
              <button 
                id="suggestedQuestion3" 
                onClick={(event) => {
                  const thisQuestion = document.getElementById("suggestedQuestion3") as HTMLInputElement
                  const userInput = document.getElementById("userInput") as HTMLInputElement
                  userInput.value = thisQuestion.innerHTML
                }}
              >                How can we address and prevent AI systems from perpetuating or amplifying biases in hiring, promotions, and workplace evaluations?
              </button>
              <p>Interact with ChatGPT to explore its views on the impact of AI on the workforce. Try asking about specific concepts, or use one of the premade questions above</p>
              <textarea id="userInput" placeholder="Type your question here..."></textarea>
              <button onClick={(event) => {
                const userInput = document.getElementById("userInput") as HTMLInputElement
                event.target.innerHTML = "Loading..."
                // disable the button
                event.target.setAttribute("disabled", "true")
                event.target.setAttribute("disabled", "false")
                event.target.innerHTML = "Ask"
              }}>Ask</button>   
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