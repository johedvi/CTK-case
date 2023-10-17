import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReactRouter, { redirect, useParams } from 'react-router-dom';

interface Forum{
  title : string;
  description : string;
  author : string;
  users : Array<string>;
  posts : Array<Post>;
}
interface Post{
  id : number,
  title : string;
  author : string;
  comments : number;
}
let forumString : string;
function App() {
  const { forumId } = useParams();
  const [page,setForums] = useState<Forum>();

  const [postTitle, setTitle] = useState<String>();
  const [postBody, setBody] = useState<String>();

  async function updateForums(){  
    const response = await axios.get<Forum>("http://localhost:8080/forum/"+forumId?.toString());
    setForums(response.data);
  }

  useEffect(()=>{
    updateForums();
  },[])
  
  return (
    require("./css/forumPage.css"),
    <>
      <div id="forumPage">
      <h2>{"Welcome to - " + page?.title}</h2>
      <h3>{page?.description + " - "}<a className="linkStyle" href={"/profile/"+page?.author}><p className='authorLink'>{page?.author}</p></a></h3>
      
        <form id="createPost" onSubmit={async e => {
          e.preventDefault();
          await axios.put("http://localhost:8080/forum/"+forumId+"/post", {fid : forumId, title: postTitle, content: postBody}); updateForums();
        }}>
          <div className="inputBlock">
          <label>Post Title</label>
          <input id="title" type="text" onChange={(e) => {
            setTitle(e.target.value);
          }}/>
          </div>

          <div className="inputBlock">
          <label>Post Body</label>
          <input id="content" type="text" onChange={(e) => {
            setBody(e.target.value);
          }}/>
          <input type="submit" value="Post!"/>
          </div>
        </form>

    
        <ul className="list-group maintopic">
          {page?.posts.map((post) => <DisplayPosts
            key={post.id}
            id={post.id}
            title={post.title}
            author={post.author}
            comments={post.comments}
            />)}
        </ul>
      </div>
    </>
  );

  function DisplayPosts(post : Post) {
    return (
    <li className="list-group-item d-flex justify-content-between align-items-center">
      <a className="linkStyle" href={"/forum/"+page?.title+"/post/"+post.id}>{post.title}</a>
      <a className="linkStyle" href={"/profile/"+post.author}>{"posted by - "}<p className='authorLink'>{post.author}</p></a>
    </li>
  )}
}


export default App;
