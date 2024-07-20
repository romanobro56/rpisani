import { Component, For, Show, createMemo } from "solid-js"
import "../styles/project.css"

type ProjectProps = { 
  projectName: string, 
  projectDesc: string, 
  thisProjectNum: number, 
  projectImage: string, 
  githubLinks: string | { name: string; source: string; }[], 
  liveLink?: string, 
  videoSrc?: string, 
  carouselIndex: () => number  // Add this prop
}

const Project: Component<ProjectProps> = (props) => {
  // Create a memo that will update when carouselIndex changes
  const className = createMemo(() => {
    const index = props.carouselIndex();
    return `project carousel-index_${props.thisProjectNum - index} index_${props.thisProjectNum}`;
  });

  return (
    <div class={className()}>
      <div class='project-title'>{props.projectName}</div>
      <div class='project-body'>
        <div class='project-description'>{props.projectDesc}</div>
        <div class='project-assets-container'>
          <img class='project-image' src={props.projectImage} alt='Project Image' />
          <div class='project-links-container'>
            <Show when={Array.isArray(props.githubLinks)}>
              <For each={props.githubLinks as { name: string; source: string; }[]}>
                {(thisLink) => (
                  <a href={thisLink.source}>
                    <div class="project-link">
                      <img class='github-image' src='GitHub.webp' alt='GitHub Logo' />
                      <p class='github-project-text'>{thisLink.name}</p>
                    </div>
                  </a>
                )}
              </For>
            </Show>
          </div>
          <Show when={props.liveLink}>
            <a href={props.liveLink}>
              <div class="project-link">
                <img class='live-image' src='GitHub.webp' alt='Live Link Logo' />
                <p class='live-project-text'>Live</p>
              </div>
            </a>
          </Show>
        </div>
      </div>
    </div>
  )
}

export default Project