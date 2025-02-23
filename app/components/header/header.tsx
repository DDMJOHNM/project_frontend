import Head from 'next/head'
import NavBar from '../navbar/navbar'

import Link from 'next/link'
 
function Header() {
  return (
    <div>
      <Head>
        <title>Subbuteo</title>
        <meta property="og:title" content="My page title" key="title" />                
      </Head>   
      <div>  
        <div className="grid grid-rows-1 grid-flow-col justify-center text-white bg-lime-900">
          <div className="row-span-1 grow ...">
            <h1 className="text-3xl font-bold underline py-8">
              <Link className='px-2' href="/">Subbuteo</Link>
              </h1>
          </div>
          <div className="col-span-1 grow ...">
          <NavBar/>
          </div>
        </div>        
      </div> 
    </div>
  )
}
 
export default Header