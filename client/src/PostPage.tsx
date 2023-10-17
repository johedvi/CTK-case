import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"
interface IComment {
    id : number,
    author: String,
    content: String,
    rating: number
}
interface IPost {
    id: number, // Unique ID of the post, used to find the specific post
    title: string, // The title of the post (length 1 to 128)
    content: string, // Body of the post (length 1 to 15000)
    author: string, // User who created the post
    comments: IComment[], // List of comments from users
    candelete : boolean
}
function App() {

    const navigate = useNavigate();

    const { forumId, postId } = useParams();
    const [commentBody, setBody] = useState<String>();

    const defaultPost = { id: -1, title: "Loading...", content: "Loading...", author: "Loading...", comments: [], candelete : false }
    const [posts, setPosts] = useState<IPost>(defaultPost);

    async function upVote(commentId : number, type : boolean) {
        try{
            await axios.post('http://localhost:8080/forum/'+forumId+'/post/'+postId+'/comment',{
                comment : commentId,
                vote : type
            });
            getPost();
        }catch(e:any){
            switch(e.response.status){
                case 400 : alert(`Something went wrong, please try again`);break; // Malformed input (params)
                case 401 : alert(`You must be logged in to vote on a comment.`);break; // Not logged in
                default: alert("Something went wrong. Please try again");
            }
        }
    }

    async function deleteComment(commentId : number) {
        try{
            await axios.delete('http://localhost:8080/forum/'+forumId+'/post/'+postId+'/comment/'+commentId);
            getPost();
        }catch(e:any){
            switch(e.response.status){
                case 400 : alert(`Something went wrong, please try again`);break; // Malformed input (params)
                case 401 : alert(`You must be logged in to delete your comment.`);break; // Not logged in
                case 403 : alert(`You do not have permission for this command.`);break; // Not author/admin
                default : alert("Something went wrong. Please try again");
            }
        }
    }

    async function deletePost(){
        try{
            await axios.delete('http://localhost:8080/forum/'+forumId+'/post/'+postId);
            alert("Post successfully deleted!");
            navigate(-1);
        }catch(e:any){
            switch(e.response.status){
                case 400 : alert("Unable to delete post. Please try again later, or contact staff");break;
                case 401 : alert("You must be signed in to delete a post.");break;
                case 403 : alert("You do not have authorization for this command.");break;
                default : alert("Something went wrong. Please try again.");
            }
        }
    }

    /* Fetches new/updated Post object */
    async function getPost() {
        const getPost = (postId == null) ? "" : postId;
        const getForum = (forumId == null) ? "" : forumId;
        const response = await axios.get("http://localhost:8080/forum/" + getForum + "/post/" + getPost);
        setPosts(response.data);
    }

    useEffect(() => {
        getPost();
    }, [])

    function DisplayComment(comment: IComment) {
        return <li className="comment"><a className="linkStyle" href={"/profile/"+comment.author}>{"posted by - "}<p className='authorLink'>{comment.author}</p></a> 
         <p className="delete"><a href="#" onClick = {e=>deleteComment(comment.id)}>{String.fromCharCode(10006)}</a></p>
        <p className="rating"><a href="#" onClick={e=>upVote(comment.id,true)}>{String.fromCharCode(8593)}</a>
        {" Rating: " + comment.rating + " "}<a href="#" onClick={e=>upVote(comment.id,false)}>{String.fromCharCode(8595)}</a></p>
        <p>{comment.content}</p>
        </li>
    }

    return (
        require("./css/postPage.css"),
        <div>
            <h1>{posts.title}</h1>
            <h3>{"posted by - "}<p className='authorLink'>{posts.author}</p></h3>
            <div className="post">
                {
                (posts.candelete) && (
                <p className="delete"><a className="linkStyle" href="#" onClick={e=>deletePost()}>{String.fromCharCode(10006)}</a></p>
                )
                }
                <p className="postContent">{posts.content}</p>
            </div>


            
            <form id="createComment" onSubmit={async e => {
                try {
                    e.preventDefault();
                    await axios.put("http://localhost:8080/forum/" + forumId + "/post/" + postId + "/comment", { content: commentBody });
                    getPost();
                } catch (e: any) {
                    switch(e.response.status){
                        case 401 : alert("Please sign in before commenting"); break;
                        default : alert("Unexpected error when commenting. Please try again"); break;
                    }
                }
            }}>
                <label>Post Comment</label>
                <input type="text" onChange={(e) => {
                    setBody(e.target.value);
                }} />
                <input type="submit" value="Comment!" />
            </form>

            <h4>{"Comments"}</h4>
            {posts.comments.map((comment) => <DisplayComment
                key={comment.id}
                id={comment.id}
                author={comment.author}
                content={comment.content}
                rating={comment.rating}
            />)}
        </div>
    );
}
export default App;