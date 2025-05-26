import React from 'react'

const WaitPage = () => {
  return (
    <div>
      <div className='absolute w-full h-full bg-black opacity-50'></div>
      <div className='absolute w-full h-full flex justify-center items-center'>
        <div className='w-10 h-10 bg-white rounded-full'></div>
      </div>
    </div>
  )
}

export default WaitPage