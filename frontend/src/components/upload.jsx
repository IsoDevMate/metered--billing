import React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
//import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { useAuth } from './context/context'
import  { storage,db} from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export const Adminupload = ({ className }) => {
  const [files, setFiles] = useState([])
  const [rejected, setRejected] = useState([])
  const [percent, setPercent] = useState(0)
    const [url, setUrl] = useState(null)
const [msg, setMsg] = useState(null)
const { user } = useAuth()
const navigate = useNavigate()

React.useEffect(() => {
    if (user) {
        console.log("User:", user);
    }
}, [user]);

  //avoid repeated rerendering on componnet call 
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (acceptedFiles?.length) {
      setFiles(previousFiles => [
        ...previousFiles,
        ...acceptedFiles.map(file =>
          Object.assign(file, { preview: URL.createObjectURL(file) })
        )
      ])
    }

    if (rejectedFiles?.length) {
      setRejected(previousFiles => [...previousFiles, ...rejectedFiles])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': [],
        'video/*': [],
        'text/html': [],

    },
    maxSize: 1024000 * 1000,
    onDrop
  })

  useEffect(() => {
    // Revoke the data uris to avoid memory leaks
    return () => files.forEach(file => URL.revokeObjectURL(file.preview))
  }, [files])

  const removeFile = useCallback(name => {
    setFiles(files => files.filter(file => file.name !== name))
  },[])

  const removeAll = useCallback(() => {
    setFiles([])
    setRejected([])
  },[])

  const removeRejected = useCallback(name => {
    setRejected(files => files.filter(({ file }) => file.name !== name))
  },[])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!files?.length) return;
    
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnapshot = await getDoc(userDocRef);

      console.log('userDocSnapshot', userDocSnapshot)	
  
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        const userId = userData.userId;
  
        console.log('userId', userId);
     
  
    const formData = new FormData();
    for (const file of files) {
      formData.append('image', file); 
    }
    formData.append('userId', userId);
  
  
  try{
      const response = await axios.post('http://localhost:5050/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setPercent(percentCompleted);
        },
      });
       
      console.log('File uploaded successfully:', response.data.fileUrl);
      setMsg('File uploaded successfully');
      setPercent(100);
      console.log('response', response.data);

   //   const fileData = {
     //   fileName: response.data.fileName,
   //     fileUrl: response.data.fileUrl,
  //    };
    
 //     console.log('fileData', fileData);
      //i want to pass this file data to the dashboard componnnent 

  //    navigate(`/dashboard/:${userId}`, { state: { fileData } });
  const fileData = {
    fileId: response.data.fileUrl.split('/').pop(), // Extract the fileId from the fileUrl
    fileName: response.data.fileName,
  };
  
  navigate(`/dashboard`, { state: { fileData } });
    } catch (error) {
      console.error('Error uploading file:', error);
      setMsg('Error uploading file');
    }
  };
  }, [files, user, navigate]);

  return (
    <div className='container mx-auto px-4'>
    <form onSubmit={handleSubmit}>
      <div
        {...getRootProps({
          className: className
        })}
      >
        <input {...getInputProps()} />
        <div className='flex flex-col items-center justify-center gap-4 p-4 border-2 border-dashed rounded-md border-neutral-200'>
        
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <p>Drag & drop files here, or click to select files</p>
          )}
        </div>
      </div>


      {/* Preview */}
      <section className='mt-10'>
        <div className='flex gap-4'>
          <h2 className='title text-3xl font-semibold justify-center text-neutral-600 place-items-center align-middle'>Preview</h2>
          <button
            type='button'
            onClick={removeAll}
            className='mt-1 text-[12px] uppercase tracking-wider font-bold text-neutral-500 border border-red-400 rounded-md px-3 hover:bg-red-400 hover:text-white transition-colors'
          >
            Remove all files
          </button>
          <button
            onClick={handleSubmit}
            type='submit'
            className='ml-auto mt-1 text-[12px] uppercase tracking-wider font-bold text-neutral-500 border border-orange-400 rounded-md px-3 hover:bg-orange-400 hover:text-white transition-colors'
        
          >
            Upload to BUcket
          </button>
        </div>
        {/* Accepted files */}
        <h3 className='title text-lg font-semibold text-neutral-600 mt-10 border-b pb-3'>
          Accepted Files
        </h3>
        <ul className='mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-10 '>
          {files.map(file => (
            <li key={file.name} className='relative h-32 rounded-md shadow-lg'>
              <img   
                src={file.preview}
                alt={file.name}
                width={100}
                height={100}
                onLoad={() => {
                  URL.revokeObjectURL(file.preview)
                }}
                className='h-full w-full object-contain width-100  rounded-md  transition-all duration-200 ease-in-out'
              />
              <button
                type='button'
                className='w-7 h-7 border border-red-400 bg-red-400 rounded-full flex justify-center items-center absolute -top-3 -right-3 hover:bg-white transition-colors'
                onClick={() => removeFile(file.name)}
              >
               
              </button>
              <p className='mt-2 text-neutral-500 text-[12px] font-medium'>
                {file.name}
              </p>
            </li>
          ))}
        </ul>

        {/* Rejected Files */}
        <h3 className='title text-lg font-semibold text-neutral-600 mt-24 border-b pb-3'>
          Rejected Files
        </h3>
        <ul className='mt-6 flex flex-col'>
          {rejected.map(({ file, errors }) => (
            <li key={file.name} className='flex items-start justify-between'>
              <div>
                <p className='mt-2 text-neutral-500 text-sm font-medium'>
                  {file.name}
                </p>
                <ul className='text-[12px] text-red-400'>
                  {errors.map(error => (
                    <li key={error.code}>{error.message}</li>
                  ))}
                </ul>
              </div>
              <button
                type='button'
                className='mt-1 py-1 text-[12px] uppercase tracking-wider font-bold text-neutral-500 border border-red-400 rounded-md px-3 hover:bg-sred-400 hover:text-white transition-colors'
                onClick={() => removeRejected(file.name)}
              >
                remove
              </button>
            </li>
          ))}
        </ul>
      </section>
    </form>
    </div>
  )
}