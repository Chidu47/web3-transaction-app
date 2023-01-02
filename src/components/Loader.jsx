import React from 'react'

const Loader = () => {
    return (
        <div className='flex justify-center items-center py-1'>
            <div className='animate-spin rounded-full h-28 w-28 border-b-2 border-red-700' />
        </div>
    )
}

export default Loader