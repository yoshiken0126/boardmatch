import Navbar from '@/components/navbar'
import BottomNavigation from '@/components/bottom-navigation'
import { Children } from 'react';


export default function MainLayout({children}) {
  return (
    <div className="main-layout">
    <div> <Navbar /></div>



    <main>{children}</main>


   <BottomNavigation/>
   </div>
  );
}