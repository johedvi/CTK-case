function App() {  
  return (
    require('./css/merch.css'),
    <>
      <div>
        <h1> Merch </h1>

        <div id="merch">
          <div className="item">
            <img src="/t1.png"></img>
            <p className="tag">12$</p>
            <p className="tag">T-shirt with logo</p>
          </div>
          <div className="item">
            <img src="/t2.png"></img>
            <p className="tag">12$</p>
            <p className="tag">T-shirt with logo</p>
            <div></div>
          </div>
        </div>
      </div>
    </>
  );
}
export default App;
