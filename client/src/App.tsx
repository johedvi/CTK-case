import React from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

/*
Site imports
*/
import Forums from "./Forums";
import ForumPage from "./ForumPage";
import PostPage from "./PostPage";
import Navbar from './Navbar';
import Homepage from './homepage';
import LoginPage from './LoginPage';
import Merch from './Merch';
import SearchPage from './SearchPage';
import Settings from './SettingsPage';
axios.defaults.withCredentials = true; // For session cookies

class Start extends React.Component {
  render() {
    return (
      <>
      <Navbar></Navbar>
      <div className='container'>
        <Router>
          <Routes>
            <Route path="/" element={<Homepage />}></Route>
            <Route path="/merch" element={<Merch />}></Route>
            <Route path="/forum" element={<Forums />}></Route>
            <Route path="/forum/:forumId" element={<ForumPage />}></Route>
            <Route path="/forum/:forumId/post/:postId" element={<PostPage />}></Route>
            <Route path="/login" element={<LoginPage />}></Route>
            <Route path="/search" element={<SearchPage/>}></Route>
            <Route path="/settings" element={<Settings/>}></Route>
          </Routes>
        </Router>
      </div>
      </>
    )
  }
}
export default Start;