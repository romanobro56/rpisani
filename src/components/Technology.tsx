import { Component } from 'solid-js'
import '../styles/technology.css'

export const Technology: Component<{technologyName: string, progressNum: string}> = (props) => {
  return (
    <div class='technology'>
      <div class='technology-top-container'>
        <img class='technology-logo' src={`${props.technologyName}.webp`} alt={props.technologyName}></img>
        <p class='technology-title'>{props.technologyName}</p>
      </div>
      <div class='progress-container'>
        <div class='progress-bar' style={`width: ${props.progressNum}%`}></div>
      </div>
    </div>
  )
}