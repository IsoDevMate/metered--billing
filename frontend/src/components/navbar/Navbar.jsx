import React, { useState, useEffect, useRef } from 'react';
import './Navbar.css';
import { Link } from 'react-router-dom';
import icon from '../../assets/react.svg';
import { useContext } from 'react';
import { FiMenu } from "react-icons/fi";
import { IoCloseSharp } from "react-icons/io5";
import { useAuth } from '../context/context';
import { IoPersonCircleOutline } from "react-icons/io5";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate } from 'react-router-dom'; 

export const Navbar = () => {
  const navigate = useNavigate();
    const [menu, setMenu] = useState("shop");
  
    const menuRef = useRef();
    const { user,setUser } = useAuth();
    const dropdown_toggle = (e) => {
        menuRef.current.classList.toggle('nav-menu-visible');
        e.target.classList.toggle('open');
    };

    /* STICKY NAVBAR */
    const [navbarSticky, setNavbarSticky] = useState(false);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleScroll = () => {
        if (window.scrollY > 70) {
            setNavbarSticky(true);
        } else {
            setNavbarSticky(false);
        }
    };

    React.useEffect(() => {
      console.log("User:", user);
    }
    , [user]);

    /* Code for the close and open animation of hamburguer menu in mobile devices */
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const dropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleClick = (e) => {
        dropdownToggle();
        dropdown_toggle(e);
    };

    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

    const toggleUserDropdown = () => {
        setIsUserDropdownOpen(!isUserDropdownOpen);
    };
 

    const logout = () => {
      if (window.confirm("Are you sure you want to log out?")) {
        signOut(auth)
          .then(() => {
            console.log("User signed out");
            setUser(null); 
            navigate("/", { replace: true });
          })
          .catch((error) => {
            console.error("Logout error:", error.message);
          });
      }
    };

    const handleLogout = () => {
        logout();
        toggleUserDropdown();
    };

    return (
        <div className={navbarSticky ? "navbar sticky" : "navbar"}>
            <div className="nav-logo">
                <img src={icon} alt="logo" />
                <p>SHOPPER</p>
            </div>

            <ul ref={menuRef} className="nav-menu">
                <li onClick={() => { setMenu("explore") }}><Link style={{ textDecoration: 'none', color: 'black' }} to='/'>Home</Link> {menu === "shop" ? <hr /> : <></>}</li>
            </ul>
            <div className="nav-login-cart">
                {user ? (
                    <div className="nav-user-dropdown">
                        <div className="nav-user-info" onClick={toggleUserDropdown}>
                            <IoPersonCircleOutline className="nav-user-icon" />
                            <span>{user.email}</span>
                        </div>
                        {isUserDropdownOpen && (
                            <div className="nav-user-dropdown-menu">
                                <button onClick={handleLogout}>Sign Out</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link to='/login'>
                        <button >Login</button>
                    </Link>
                )}
              

                <div className="nav-cart-count">
            
                </div>
            </div>
            <div className='hamburger'>
                {isDropdownOpen ? (
                    <IoCloseSharp className='nav-dropdown' onClick={handleClick} />
                ) : (
                    <FiMenu className='nav-dropdown' onClick={handleClick} />
                )}
            </div>
        </div>
    );
};
