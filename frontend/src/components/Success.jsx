import React from 'react'
import { FaCheck } from "react-icons/fa";
import { Link } from 'react-router-dom';
import './css/Success.css'

const Success = () => {
  return (
    <div className='main'>
        <div className='success-page'>
            <div className="success-icon">
                <FaCheck />
            </div>
            <h1>Payment Successful</h1>
            <h3>Your payment has been processed Successfully</h3>
            <p>Click on the button below to continue shopping</p>
            <Link to= '/' >
                <button>Continue Shopping</button>
            </Link>
            
        </div>
    </div>
    
  )
}

export default Success