import { For, Show, createEffect, createSignal } from "solid-js";
import { isServer } from "solid-js/web";
import { technologiesData, projectsData } from "../data/experience"
import { Technology } from '../components/Technology'
import '../styles/index.css'
import Project from "~/components/Project";

export const [carouselIndex, setCarouselIndex] = createSignal(0)

export default function Home() {
  const [technologies, setTechnologies] = createSignal(technologiesData)
  const [projects, setProjects] = createSignal(projectsData)

  createEffect(async () => {
    const projectjs = await import ('../scripts/carousel.js')
    if (!isServer) {
      projectjs.adjustMargin()
      window.onresize = projectjs.positionCards
    }
  })

  return (
    <main>
      <div class='main-container'>
        <div class='left'>
          <img class='profile' src='https://media.licdn.com/dms/image/D4D03AQH8X3XzN7w97Q/profile-displayphoto-shrink_400_400/0/1695224793399?e=1702512000&v=beta&t=CtUS0H8IczH5qjyuzzKTY7e5aVqInz6E9a4pHctFQW4' height='100px' width='100px'></img>
            <div class='socials-container'>
              <a class='social-button' href='https://www.linkedin.com/in/roman-pisani/'>
                <div class='social-divider'>
                  <p class='social-desc'>Connect with me on LinkedIn:</p>
                  <img class='social-img' src='LinkedIn.webp' height='34px' width='34px'></img>
                </div>
              </a>
              <a class='social-button' href='https://github.com/romanobro56'>
                <div class='social-divider'>
                  <p class='social-desc'>Or, check out my Github here:</p>
                  <img class='social-img' src='GitHub.webp' height='34px' width='34px'></img>
                </div>
              </a>
            </div>
          <div class='technologies-container'>
            <For each={technologies()}>{(thisTechnology, i) =>
              <Technology technologyName={thisTechnology.name} progressNum={thisTechnology.progress}></Technology>
            }</For>
          </div>
        </div>
        <div class='right'>
          <h1 class="name">Hi, I'm Roman Pisani 👋</h1>
          <p class='desc'>I'm a software developer attending the University of Massachusetts Amherst</p>
         <div class='projects-container'>
            <h2 class='projects-title'>My Projects</h2>
  
              <div class='carousel-container'>
                <For each={projects()}>{(thisProject, i) => 
                  <Project 
                    projectName={thisProject.name} 
                    projectDesc={thisProject.description} 
                    thisProjectNum={i()}
                    githubLink=""
                    liveLink=""
                    projectImage=""
                  />
                }</For>
              </div>
              
              <div class='carousel-buttons'>
                <Show when={carouselIndex() > 0} fallback={<></>}>
                  <button class='carousel-decrement' onClick={() => setCarouselIndex((prev) => prev - 1)}>&lt;</button>
                </Show>
                <span class='carousel-active-counter'>{carouselIndex() + 1 + '/' + projects().length}</span>
                <Show when={carouselIndex() < projects().length - 1} fallback={<></>}>
                  <button class='carousel-increment' onClick={() => setCarouselIndex((prev) => prev + 1)}>&gt;</button>
                </Show> 
              </div>
              
          </div>
          <div class='projects-container'>
            
          </div>
          <div class='experience-container'>
            <div class='experience-divider'>
              <p class='experience-title'>Build UMass</p>
              <img src='buildumass.png' height='50px' width='50px'></img>
              <p class='experience-description'>At Build UMass, students work together to create real world apps to help nonprofit organizations in an inrceasingly digital age. I work as a software developer, and you can check out our Instagram here!</p>
            </div>
            <div class='experience-divider'>
              <p class='experience-title'>Innov8</p>
              <img src='innov8.png' height='50px' width='50px'></img>
              <p class='experience-description'>Innov8 is a new club at UMass Amherst that is aimed at helping members with an entreprenurial spirit get started on their projects, and will eventually help them push to production!</p>
            </div>
            <div class='experience-divider'>
              <p class='experience-title'>Machine Learning Club</p>
              <img src='mlc.png' height='50px' width='50px'></img>
              <p class='experience-description'>Machine Learning Club is a lecture-style club where students come to learn about all things machine learning! I attend the beginner series lectures.</p>
            </div>
            <div class='experience-divider'>
              <p class='experience-title'>Robotics Club</p>
              <img src='robotics.png' height='50px' width='50px'></img>
              <p class='experience-description'>In high school, I was a member of Robotics club, where we learned teamwork and how to put together a robot. But more importantly, we had a lot of fun and ate a ton of munchkins!</p>
            </div>
          </div>
          <div class='resume-container'>
            <a href='resume.pdf' download><h2>If you want to download my resume, please do so here</h2></a>
          </div>
          <div class='hobbies-container'>
            <p class='hobbies-title'>Hobbies</p>
            <p class='hobbies-description'>Outside of programming, I love to play basketball, go to the gym and type fast! You can check out my typing profile here</p>
          </div>
        </div>
      </div>
    </main>
  );
}