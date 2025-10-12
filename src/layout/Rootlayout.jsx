import React from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { Outlet } from 'react-router-dom'

const Rootlayout = () => {
  return (
    <div>
        <Nav />
        <Outlet />
        <Footer />
    </div>
  )
}

export default Rootlayout