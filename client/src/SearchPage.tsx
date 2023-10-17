import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReactRouter from 'react-router-dom';


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
  const [searchName, setSearch] = useState<String>();

  async function updateForums() {
    const response = await axios.get<Forum[]>("http://localhost:8080/forum/", { data: { itemId: searchName } });
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
        <form id="search" onSubmit={async e => {
          e.preventDefault();
          updateForums();

        }}>

          <div className="inputBlock">
          <label>Search</label>
          <input type="text" id="search" placeholder="Name" onChange={(e) => {
            setSearch(e.target.value);
          }} />
          </div>
          <input type="submit" value="Search!"/>
          
  
        </form> 

        <div className="forums">
          {forums.map((forum) => <DisplayForum
            key={forum.title}
            title={forum.title}
            description={forum.description}
            author={forum.author}
            posts={forum.posts} />)}
        </div>
      </div>
    </>
  );
}

function DisplayForum(forum: Forum) {
  return (
      <div className="forumBlock">
        <a className="forumLink" href={"/forum/"+forum.title}>
        <div className="forumTitle">
          <h2>{forum.title}</h2>
        </div></a>
        <a href={"profile/"+forum.author}>
          <div className="forumAuthor">
            <h5>{forum.author ? forum.author : "Author"}</h5>
          </div>
        </a>
        <div className="forumDescription">
          <h5>{forum.description}</h5>
        </div>
        <div className="icons">
          <a href={"#subscribe"}>
            {
              /* if (author subscribed to forum) {
                <img src="starY.png"></img>
              } */
            // else 
            <img src="star.png"></img>
            }
          </a>
        </div>
      </div>

  )
}
export default App;
