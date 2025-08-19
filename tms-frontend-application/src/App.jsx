import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [title, setTitle] = useState("Default Title");

  useEffect (() => {
    fetch('http://localhost:8080/home').then(response=>response.text())
      .then(text => {
        setTitle(text);
      })
      .catch(error => {
        console.error('Error fetching title:', error);
      }
    );
  }, []);

  return (
    <>
      <h1>Welcome to the Transformer Maintenance System</h1>
      <h1>React + {title}</h1>

    </>
  )
}

export default App
