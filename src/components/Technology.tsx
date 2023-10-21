import { Component } from 'solid-js'
import '../styles/technology.css'

export const Technology: Component<{technologyName: string, progressNum: string}> = (props) => {
  return (
    <div class='technology'>
      <img class='technology-logo' src={`${props.technologyName}.webp`} alt={props.technologyName}></img>
      <p class='technology-title'>{props.technologyName}</p>
      <div class='progress-bar'>
        <div class={`progress${props.progressNum}`}></div>
      </div>
    </div>
  )
}