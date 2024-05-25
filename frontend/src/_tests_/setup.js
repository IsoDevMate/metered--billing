import "@testing-library/jest-dom"
import  {afterEach, beforeEach} from 'vitest'
import { cleanup } from "@testing-library/react"

//beforeEach(()=>{
    
//})
afterEach(() => {
    cleanup()
})