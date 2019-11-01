import React, { Component } from 'react'
import App from "./App";
import { ToastContainer, toast } from 'react-toastify';
import "./styles/toast.global.css";

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
