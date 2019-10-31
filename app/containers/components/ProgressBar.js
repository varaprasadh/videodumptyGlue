import React, { Component } from 'react'
import styles from "./styles/progressbar.css";
import Progress from 'react-progressbar';


export class ProgressBar extends Component {
    render() {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                  <div className={styles.border}>
                       <Progress completed={this.props.percent}/>
                  </div>
                  <div className={styles.label}>processing...</div>
                </div>
            </div>
        )
    }
}

export default ProgressBar
