import { UserProfile } from '@clerk/clerk-react'
import React from 'react'

const HomePage = () => {
    return (
        <>
            <div className='text-3xl font-bold underline'>HomePage</div>
            <UserProfile />
        </>
    )
}

export default HomePage