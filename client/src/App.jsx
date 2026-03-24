import { useState } from 'react'
import { Routes, Route } from 'react-router';
import './App.css'

function App() {
  return (
    <>
      <Routes>
        <Route path='/' element='This is the home route' />
        <Route path='/login' element='this is the login route' />
        <Route path='/register' element='this is the register route' />
        <Route path='/dashboard' element='this is the dashboard route' />
      </Routes>
    </>
  )
}

export default App
