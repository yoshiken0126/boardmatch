import NavigationBar from '@/components/cafe-navigation-bar'
import { Children } from 'react';


export default function CafeLayout({children}) {
  return (
    <div className="main-layout">
    <div> <NavigationBar/></div>



    <main>{children}</main>


   </div>
  );
}