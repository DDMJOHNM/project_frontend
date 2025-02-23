import Link from 'next/link'
 
function NavBar() {
  return (
    <nav className='py-10 px-8'>                      
        <Link className='px-2' href="/scoreboard">Scoreboard</Link>
        <Link className='px-2' href="/teams">Teams</Link>
        <Link className='px-2' href="/cup">Cup</Link>
        <Link className='px-2' href="/league">League</Link>            
    </nav>  
  )
}
 
export default NavBar