import { For, Show, createEffect, createSignal } from "solid-js";
import { technologiesData, projectsData } from "../data/experience"
import { Technology } from '../components/Technology'
import '../styles/index.css'
import Project from "~/components/Project";

export const [carouselIndex, setCarouselIndex] = createSignal(0)

export default function Home() {
  const [technologies, setTechnologies] = createSignal(technologiesData)
  const [projects, setProjects] = createSignal(projectsData)

  return (
    <main>
      <div class='main-container'>
        <div class='left'>
          <img class='profile' src='https://media.licdn.com/dms/image/D4D03AQH8X3XzN7w97Q/profile-displayphoto-shrink_400_400/0/1695224793698?e=1708560000&v=beta&t=Fp1UPNMpogYsID5rcR23QoBFcZotOVyAj6PrszSfYgY' height='100px' width='100px' alt='Roman Profile Picture'></img>
            <div class='socials-container'>
              <a class='social-button' href='https://www.linkedin.com/in/roman-pisani/'>
                <div class='social-divider'>
                  <p class='social-desc'>Connect with me on LinkedIn:</p>
                  <img class='social-img' src='LinkedIn.png' height='34px' width='34px' alt='LinkedIn Logo'></img>
                </div>
              </a>
              <a class='social-button' href='https://github.com/romanobro56'>
                <div class='social-divider'>
                  <p class='social-desc'>Or, check out my Github here:</p>
                  <img class='social-img' src='GitHub.webp' height='34px' width='34px' alt='GitHub Logo'></img>
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
          <div class='projects-container'>
            
          </div>
          <div class='experience-container'>
            <div class='experience-divider build'>
              <p class='experience-title'>Build UMass</p>
              <img src='BUILDUMass.jpeg' height='50px' width="50px" alt='BUILD UMass Logo'></img>
              <p class='experience-description'>At Build UMass, students work together to create real world apps to help nonprofit organizations in an increasingly digital age. I work as a software developer, and you can check out our Instagram <a href='https://www.instagram.com/build.umass/'>here.</a></p>
            </div>
            <div class='experience-divider innov8'>
              <p class='experience-title'>Innov8</p>
              <img src='Innov8.png' height='50px' width='100px' style={"background-color: white"} alt='Innov8 Logo'></img>
              <p class='experience-description'>Innov8 is a new club at UMass Amherst that is aimed at helping members with an entreprenurial spirit get started on their projects, and will eventually help them push to production!</p>
            </div>
            <div class='experience-divider mlc'>
              <p class='experience-title'>Machine Learning Club</p>
              <img src='MachineLearningClub.webp' height='50px' width='50px' alt='Machine Learning Club Logo'></img>
              <p class='experience-description'>Machine Learning Club is a lecture-style club where students come to learn about all things machine learning.</p>
            </div>
            <div class='experience-divider robotics'>
              <p class='experience-title'>Robotics Club</p>
              <img src='Robotics.jpeg' height='50px' width='50px' alt='Robotics Club Logo'></img>
              <p class='experience-description'>In high school, I was a member of Robotics club, where we learned teamwork and how to put together a robot. But more importantly, we had a ton of fun.</p>
            </div>
          </div>
          <a class='resume-container' href='RomanPisaniResume.pdf' download>
              <h2 class='resume-text'>If you want to download my resume, please click here</h2>
          </a>
          <div class='hobbies-links'>
            <a href='https://instagram.com/roman.pisani56'>
              <img src='Instagram.png' height='50px' width='50px' alt='Instagram Logo'></img>
              <p class='hobbies-link-desc'>Instagram</p>
            </a>
            <a href='https://open.spotify.com/user/31uv2eoiwcnvqjfdx2ajkwj2ecem?si=f2d5678b9f4849d5'>
              <img src='Spotify.webp' height='50px' width='50px' alt='Spotify Logo'></img>
              <p class='hobbies-link-desc'>Spotify</p>
            </a>
            <a href='https://monkeytype.com/profile/5x1YFdKliUbbOSKecWLFZVfv4LZ2?isUid'>
              <img src='MonkeyType.png' height='50px' width='50px' alt='MonkeyType Logo'></img>
              <p class='hobbies-link-desc'>MonkeyType</p>
            </a>
          </div>

        </div> 
      </div>
    </main>
  );
}