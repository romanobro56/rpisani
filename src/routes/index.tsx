import { For, Show, createEffect, createSignal } from "solid-js";
import { projectsData } from "../data/experience"
import '../styles/index.css'
import Project from "~/components/Project";

export const [carouselIndex, setCarouselIndex] = createSignal(0)

export default function Home() {
  const [projects, setProjects] = createSignal(projectsData)
  createEffect(async () => {
    // const scroller = await import ('../scripts/side-scroller.js')
  })
  return (
    <main>
      <div class='main-container'>
        <div class='header-container'>
          <div class="header-left">
            <h1 class="name">Hi, I'm Roman Pisani 👋</h1>
            <p class='desc'>I'm a software developer attending the University of Massachusetts Amherst</p>
          </div>
          <div class='header-right'> 
            <a class='social-link' href='http://linkedin.com/in/roman-pisani' target="_blank" rel="noopener noreferrer">
              <img class='social-image' src='LinkedIn.png'></img>
            </a>
            <a class='social-link' href='http://github.com/romanobro56' target="_blank" rel="noopener noreferrer">
              <img class='social-image' src='GitHub.webp'></img>
            </a>
            <a class='social-link' href='http://mailto:romanp2929@gmail.com' target="_blank" rel="noopener noreferrer">
              <img class='social-image' src='Email.png'></img>
            </a>
            <a class='social-link' href="http://instagram.com/roman.pisani56" target="_blank" rel="noopener noreferrer">
              <img class='social-image' src='Instagram.png'></img>
            </a>
          </div>
        </div>

        <div class='projects-container'>
          <h2 class='projects-title'>My Projects</h2>

            <div class='carousel-container'>
              <For each={projects()}>{(thisProject, i) => 
                <Project 
                  projectName={thisProject.name} 
                  projectDesc={thisProject.description} 
                  thisProjectNum={i()}
                  githubLinks={thisProject!.githubLinks}
                  liveLink={thisProject.liveLink}
                  projectImage={thisProject.image}
                />
              }</For>
            </div>
            
            <div class='carousel-buttons'>
              <Show when={carouselIndex() > 0}>
                <button class='carousel-decrement' onClick={() => setCarouselIndex((prev) => prev - 1)}>&lt;</button>
              </Show>
              <span class='carousel-active-counter'>{carouselIndex() + 1 + '/' + projects().length}</span>
              <Show when={carouselIndex() < projects().length - 1}>
                <button class='carousel-increment' onClick={() => setCarouselIndex((prev) => prev + 1)}>&gt;</button>
              </Show>
            </div>

        </div>
        <div class='secondary-container'>
          <div class='experience-container'>

            <div class='experience-divider build'>
              <div class='experience-header'>
                <p class='experience-title'>Build UMass</p>
                <img class='experience-image' src='BUILDUMass.jpeg' height='50px' width="50px" alt='BUILD UMass Logo'></img>
              </div>
              <p class='experience-description'>BUILD UMass is a pro-bono tech consulting group making tech more accessible to non-profits and startups. You can check out our Instagram <a href='https://www.instagram.com/build.umass/'>here.</a></p>
            </div>

            <div class='experience-divider innov8'>
              <div class='experience-header'>
                <p class='experience-title'>Innov8</p>
                <img class='experience-image' src='Innov8.png' height='50px' width='100px' style={"background-color: white"} alt='Innov8 Logo'></img>
              </div>
              <p class='experience-description'>Empowering entrepreneurs at UMass Amherst to transform ideas into production-ready projects</p>
            </div>

            <div class='experience-divider mlc'>
              <div class='experience-header'>
                <p class='experience-title'>Machine Learning Club</p>
                <img class='experience-image' src='MachineLearningClub.webp' height='50px' width='50px' alt='Machine Learning Club Logo'></img>
              </div>
              <p class='experience-description'>A lecture-style club where students learn about all things machine learning.</p>
            </div>

            <div class='experience-divider robotics'>
              <div class='experience-header'>
                <p class='experience-title'>Robotics Club</p>
                <img class='experience-image' src='Robotics.jpeg' height='50px' width='50px' alt='Robotics Club Logo'></img>
              </div>
              <p class='experience-description'>Explored teamwork and robotics assembly in the Franklin High School Robotics Club.</p>
            </div>
          </div>
          <div class='technologies-contact-container'>

            <div class='skills-container'>
       
              <div class='skills-divider'>
                <p class='skills-title'>Languages</p>
                <p class='skills-item'>JavaScript</p>
                <p class='skills-item'>TypeScript</p>
                <p class='skills-item'>Python</p>
                <p class='skills-item'>C ++</p>
                <p class='skills-item'>Java</p>
              </div>
              <div class='skills-divider'>
                <p class='skills-title'>Frameworks</p>
                <p class='skills-item'>ReactJS</p>
                <p class='skills-item'>NextJS</p>
                <p class='skills-item'>SolidJS</p>
                <p class='skills-item'>ExpressJS</p>
                <p class='skills-item'>RobotC</p>
              </div>
              <div class='skills-divider'>
                <p class='skills-title'>Libraries</p>
                <p class='skills-item'>TailwindCSS</p>
                <p class='skills-item'>Mongoose</p>
                <p class='skills-item'>DiscordJS</p>
                <p class='skills-item'>Bcrypt</p>
                <p class='skills-item'>OpenAI \(python\)</p>
              </div>
              <div class='skills-divider'>
                <p class='skills-title'>Tools</p>
                <p class='skills-item'>Contentful</p>
                <p class='skills-item'>MongoDB</p>
                <p class='skills-item'>Railway</p>
                <p class='skills-item'>VSCode</p>
                <p class='skills-item'>Git</p>
                <p class='skills-item'>GitHub</p>
              </div>
            </div>
            <a class='resume-container' href='RomanPisaniResume.pdf' download>
                <h2 class='resume-text'>Resume</h2>
              </a>
          </div>
        </div>
      </div>
    </main>
  );
}