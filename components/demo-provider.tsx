'use client';
import {createContext,useState,type Dispatch,type SetStateAction} from 'react';
import type {DataSet} from '@/types';
export const DemoContext=createContext<{data:DataSet;setData:Dispatch<SetStateAction<DataSet>>}|null>(null);
export function DemoProvider({children,initialData}:{children:React.ReactNode;initialData:DataSet}){const[data,setData]=useState(initialData);return <DemoContext.Provider value={{data,setData}}>{children}</DemoContext.Provider>;}
