import React from 'react'
import './css/Failed.css'
import { CgDanger } from "react-icons/cg";
import { Link } from 'react-router-dom';

const Failed = () => {
  return (
    <div className='main'>
        <div className='fail-page'>
            <div className="fail-icon">
                <CgDanger />
            </div>
            <h1>Payment Unsuccessful</h1>
            <h3>Error Processing your payment</h3>
            <p>Click on the button to go back</p>
            <Link to= '/cart' >
                <button>Back</button>
            </Link>
            
        </div>
    </div>
  )
}

export default Failed