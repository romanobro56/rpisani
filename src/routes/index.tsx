import { For, Show, createEffect, createSignal, onMount } from "solid-js";
import { technologiesData, projectsData } from "../data/experience"
import { Technology } from '../components/Technology'
import '../styles/index.css'
import Project from "~/components/Project";

export const [carouselIndex, setCarouselIndex] = createSignal(0)

export default function Home() {
  const [technologies, setTechnologies] = createSignal(technologiesData)
  const [projects, setProjects] = createSignal(projectsData)
  createEffect(async () => {
    // const scroller = await import ('../scripts/side-scroller.js')
  })
  return (
    <main>
      <div class='main-container'>
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
                  githubLinks={thisProject.githubLinks}
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
              <p class='experience-description'>BUILD UMass is a pro-bono tech consulting group making tech more accessible to non-profits and startups. you can check out our Instagram <a href='https://www.instagram.com/build.umass/'>here.</a></p>
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
              <p class='experience-description'>Explored teamwork and robotics assembly in the Robotics Club.</p>
            </div>
          </div>
          <div class='technologies-contact-container'>
              
          </div>
        </div>
        <a class='resume-container' href='RomanPisaniResume.pdf' download>
            <h2 class='resume-text'>Resume</h2>
        </a>

      </div>
    </main>
  );
}