import { For, createSignal } from "solid-js";
import { Technology } from '../components/Technology'
import '../styles/index.css'

export default function Home() {
  const [technologies, setTechnologies] = createSignal([
    {
      name: 'JavaScript',
      progress: '7'
    },
    {
      name: 'SolidJS',
      progress: '7'
    },
    {
      name: 'TypeScript',
      progress: '5'
    },
    {
      name: 'HTML',
      progress: '7'
    },
    {
      name: 'CSS',
      progress: '6'
    },
    {
      name: 'React',
      progress: '6'
    },
    {
      name: 'NodeJS',
      progress: '7'
    },
    {
      name: 'MongoDB',
      progress: '7'
    },
    {
      name: 'Python',
      progress: '4'
    },
    {
      name: 'Java',
      progress: '6'
    },
    {
      name: 'C ++',
      progress: '2'
    },
    {
      name: 'Tailwind',
      progress: '5'
    },
    {
      name: 'Git',
      progress: '6'
    },
    {
      name: 'VSCode',
      progress: '7'
    },
  ])
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
          <p>I'm a software developer attending the University of Massachusetts Amherst</p>
          <div class='projects-container'>
            <h2>My Projects</h2>
            <div class='project'>
              <p class='project-title'>Notes App</p>
              <p class='project-description'>In this notes app, I developed a full stack application with read and write abilities, from scratch. I included a secure login system and many methods of data manipulation. The goal was to understand the inner workings of an authenticated full stack app. I accomplished this using SolidJS/SolidStart for the frontend, NodeJS and express for the backend/middleware, and MongoDB for the database.</p>
            </div>
            <div class='project'>
              <p class='project-title'>SavageSoccer / Vex Spin Up Robots</p>
              <p class='project-description'>In working on two robots over the course of my senior year in high school, I learned how to work well in teams and demonstrated leadership for the younger members of the club. In working as one of the main programmers of the robots, I learned a lot about C++, and how to program for automation and asynchonous tasks.</p>
            </div>
            <div class='project'>
              <p class='project-title'>CRUD Site</p>
              <p class='project-description'>My first full stack website, I enabled access of a database through a web interface.</p>
            </div>
            <div class='project'>
              <p class='project-title'>Retrckr</p>
              <p class='project-description'>A work in progress, I will create a website that is made to improve upon current systems of habit/personal tracking software. Retrckr will be a website where databases are connected to a live, daily-updating system that encourages the user to complete their daily tasks in the most human way possible. It is being built using NextJS and MongoDB and will feature an authentication system with multiple sign-in options.</p>
            </div>
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
