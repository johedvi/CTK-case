function Home() {
  return (
    <div className="container-fluid text-center maincontent bganim">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet"></link>
      <div className="row">

        <div className="col col-2 maincol">
          <p> Column ad space here </p>
        </div>

        <div className="col maincol" >
          <header>
            Breadit™ Main Page
          </header>

          <p>Hot Topics 🔥</p>
          <ul className="list-group maintopic">
            <li className="list-group-item d-flex justify-content-between align-items-center">
              NotElon1337 - Elon musk memes 14 Jan. 23
              <span className="badge bg-primary rounded-pill">14</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center">
              Half-Life 3 trailer released
              <span className="badge bg-primary rounded-pill">2</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center">
              BitCoin miner (FREE!!)
              <span className="badge bg-primary rounded-pill">1</span>
            </li>
          </ul>

          <p>Controversial Topics 💯</p>
          <ul className="list-group maintopic">
            <li className="list-group-item d-flex justify-content-between align-items-center">
              A list item
              <span className="badge bg-primary rounded-pill">14</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center">
              A second list item
              <span className="badge bg-primary rounded-pill">2</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center">
              A third list item
              <span className="badge bg-primary rounded-pill">1</span>
            </li>
          </ul>

          <p>Site News</p>
          <ul className="list-group maintopic">
            <li className="list-group-item d-flex justify-content-between align-items-center">
              Terms of Service changes - Effective January 23rd 2023
              <span className="badge bg-primary rounded-pill">203</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center">
              Global policy changes - Effective November 17th 2022
              <span className="badge bg-primary rounded-pill">2</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center">
              The purge 2022
              <span className="badge bg-primary rounded-pill">1</span>
            </li>
          </ul>
        </div>

        <div className="col col-2 maincol">
          Interesting things here / advertisements
        </div>
      </div>
    </div>
  )
}
export default Home;