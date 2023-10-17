import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReactRouter from 'react-router-dom';
//import './forum.css';

interface Forum {
  title: string;
  description: string;
  author: string;
  posts: Array<Post>;
}

interface Post {
  title: string;
  description: string;
  comments: [];
}

function App() {
  const [forums, setForums] = useState<Forum[]>([]);
  const [forumName, setName] = useState<String>();
  const [forumDesc, setDesc] = useState<String>();

  async function updateForums() {
    const response = await axios.get<Forum[]>("http://localhost:8080/forum");
    setForums(response.data);
  }
  useEffect(() => {
    updateForums();
  }, [])
  
  return (
    require("./css/forum.css"), // <-- avoid importing file until necessary, avoiding unused and conflicting css
    <>
      <div>
        <h1> Forums </h1>
        <form id="createForum" onSubmit={async e => {
          try{
            e.preventDefault();
            await axios.put("http://localhost:8080/forum", { title: forumName, description: forumDesc}); updateForums();
          }catch(e:any){
            switch(e.response.status){
              case 400: alert("The title or body contains illegal characters, please try again"); break;
              case 401: alert("Please sign in before creating a forum"); break;
              case 409: alert("The forum name " + forumName + " is alrady taken, please choose another"); break;
              default : alert("Unexpected error at post creating"); break;
            }
          }
        }}>
          <div className="inputBlock">
          <label>Forum name</label>
          <input type="text" placeholder="Name" onChange={(e) => {
            setName(e.target.value);
          }} />
          </div>
          
          <div className="inputBlock">
          <label>Forum description</label>
          <input type="text" placeholder="Description" onChange={(e) => {
            setDesc(e.target.value);
          }} />
          </div>
          <input type="submit" value="Create" />
        </form> 

        <div className="forums">
          <ul>
            {forums.map((forum) => <DisplayForum
              key={forum.title}
              title={forum.title}
              description={forum.description}
              author={forum.author}
              posts={forum.posts} />)}
          </ul>
        </div>
      </div>
    </>
  );
}

function DisplayForum(forum: Forum) {
  return (
      <div className="forumBlock">
        <a className="forumAuthor" href={"profile/"+forum.author}>Created by - {forum.author ? <p className='authorLink'>{forum.author}</p> : "Author"}</a>

        <a className="forumLink" href={"/forum/"+forum.title}>
        <h2 className="forumTitle">{forum.title}</h2></a>

        <h5 className="forumDescription">{forum.description}</h5>
        <div className="icons">
          <a href={"#subscribe"}>
            {
              //if (author subscribed to forum) {
              //  <img src="starY.png"></img>
              //} 
            // else 
            <img src="star.png"></img>
            }
          </a>
        </div>
      </div>
  )
}
export default App;
