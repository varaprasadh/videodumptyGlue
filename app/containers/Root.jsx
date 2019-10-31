import React, { Component } from 'react'
import App from "./App";
import { ToastContainer, toast } from 'react-toastify';

export class Root extends Component {
    render() {
        return (
            <div>
                <App/>
                <ToastContainer />
            </div>
        )
    }
}

export default Root
