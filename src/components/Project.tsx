import { createSignal, Component } from "solid-js"
import { carouselIndex } from "../routes/index"
import "../styles/Project.css"

const Project: Component<{ projectName: string, projectDesc: string, thisProjectNum: number, projectImage: string, githubLink: string | undefined, liveLink: string | undefined, videoSrc?: string }> = (props) => {
  const isCurrentProject = () => props.thisProjectNum - carouselIndex() === 0;

  return (
    <div class={`project carousel-index_${props.thisProjectNum - carouselIndex()} index_${props.thisProjectNum}`}>
      <div class='project-title'>{props.projectName}</div>
      <div class='project-body'>
        {isCurrentProject() && props.videoSrc ? 
          <video width="320" height="240" controls>
            <source src={props.videoSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          : null
        }
        <div class='project-description'>{props.projectDesc}</div>
        <img class='project-image' src={props.projectImage}></img>
        <a href={props?.githubLink}>
          <div class="project-link">
            <img class='github-image' src='GitHub.webp'></img>
            <p class='github-project-text'>GitHub</p>
          </div>
        </a>
        <a href={props?.liveLink}>
          <div class="project-link">
            <img class='live-image' src='GitHub.webp'></img>
            <p class='live-project-text'>Live</p>
          </div>
        </a>
      </div>
    </div>
  )
}

export default Project