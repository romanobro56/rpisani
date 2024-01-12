import { Component, For } from "solid-js"
import { carouselIndex } from "../routes/index"
import "../styles/project.css"

type projectProps = { 
  projectName: string, 
  projectDesc: string, 
  thisProjectNum: number, 
  projectImage: string, 
  githubLinks: { name: string; source: string; }[] | undefined, 
  liveLink: string | undefined, 
  videoSrc?: string, 
}

const Project: Component<projectProps> = (props) => {

  const isCurrentProject = () => props.thisProjectNum - carouselIndex() === 0;
  return (
    <div class={`project carousel-index_${props.thisProjectNum - carouselIndex()} index_${props.thisProjectNum}`}>
      <div class='project-title'>{props.projectName}</div>
      <div class='project-body'>
        <div class='project-description'>{props.projectDesc}</div>
        <div class='project-assets-container'>
          <img class='project-image' src={props.projectImage}></img>
          <div class='project-links-container'>
            <For each={props.githubLinks}>{(thisLink, i) =>
              <a href={thisLink.source}>
                <div class="project-link">
                  <img class='github-image' src='GitHub.webp'></img>
                  <p class='github-project-text'>{thisLink.name}</p>
                </div>
              </a>
            }</For>
          </div>
          <a href={props?.liveLink}>
            <div class="project-link">
              <img class='live-image' src='GitHub.webp'></img>
              <p class='live-project-text'>Live</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}

export default Project