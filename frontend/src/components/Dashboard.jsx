import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './context/context';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const Dashboard = () => {
  const [totalUsage, setTotalUsage] = useState(0);
  const [outstandingInvoices, setOutstandingInvoices] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnapshot = await getDoc(userDocRef);

      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        const userId = userData.userId;
        console.log('userId', userId);

        try {
          const response = await axios.get(`http://localhost:5050/users/${userId}`);
          const { totalUsage, outstandingInvoices, uploadedFiles } = response.data;
          setTotalUsage(totalUsage);
          setOutstandingInvoices(outstandingInvoices);
          setUploadedFiles(uploadedFiles);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        console.error('User data not found');
      }
    };

    fetchUserData();
  }, [user.uid]);

  const handleDownloadClick = async (fileId) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnapshot = await getDoc(userDocRef);
  
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        const userId = userData.userId;
        const firebaseUid = userId;
        const response = await axios.get(`http://localhost:5050/download/${fileId}?firebaseUid=${firebaseUid}`);
        if (response.data.outstandingInvoices && response.data.outstandingInvoices.length > 0) {
          // Redirect to Stripe Checkout session URL
          const checkoutUrl = response.data.checkoutUrl;
          window.location.href = checkoutUrl;
        } else {
          // Display download link
          const downloadLink = response.data.downloadLink;
          window.open(downloadLink, '_blank');
        }
      } else {
        console.error('User data not found');
      }
    } catch (error) {
      console.error('Error initiating download:', error);
      alert('Failed to download file');
    }
  };


  return (
    <div className="container mx-auto px-4">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <p>Total Data Usage: {totalUsage/1000000} GB </p>
      {outstandingInvoices.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mt-4 mb-2">Outstanding Invoices:</h3>
          <ul>
            {outstandingInvoices.map((invoice) => (
              <li key={invoice.id}>
                Amount: {invoice.amount} - Due Date: {invoice.dueDate}
              </li>
            ))}
          </ul>
        </div>
      )}
      <h3 className="text-xl font-bold mt-4 mb-2">Uploaded Files:</h3>
      <ul>
        {uploadedFiles.map((file) => (
          <li key={file.id} className="flex justify-between items-center">
            <span>{file.name}</span>
            <button
              onClick={() => handleDownloadClick(file.id)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Download
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

