import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './context/context';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useLocation } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
} from "@material-tailwind/react";
import Chart from "react-apexcharts";
import { Square3Stack3DIcon } from "@heroicons/react/24/outline";
import {DownloadButtton} from './downloadbuttton';
import  "./css/dashboard.css";
 
export const Dashboard = () => {
  const location = useLocation();
  const fileData = location.state?.fileData || {}; 
  console.log('fileData: on the dahboard', fileData);
  const [totalUsage, setTotalUsage] = useState(0);
  const [outstandingInvoices, setOutstandingInvoices] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [storedFileData, setStoredFileData] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; 
  const [chartData, setChartData] = useState([]);
  const [usageRecords, setUsageRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

const chartConfig = {
  type: "line",
  height: 240,
  series: [
    {
      name: "Total Usage",
      data: chartData,
    },
  ],
  options: {
    chart: {
      toolbar: {
        show: false,
      },
    },
    title: {
      text: "Total Usage vs Hours",
      align: "left",
    },
    dataLabels: {
      enabled: false,
    },
    colors: ["#020617"],
    stroke: {
      lineCap: "round",
      curve: "smooth",
    },
    markers: {
      size: 0,
    },
    xaxis: {
      type: 'numeric',
      axisTicks: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      labels: {
        style: {
          colors: "#616161",
          fontSize: "12px",
          fontFamily: "inherit",
          fontWeight: 400,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#616161",
          fontSize: "12px",
          fontFamily: "inherit",
          fontWeight: 400,
        },
      },
    },
    grid: {
      show: true,
      borderColor: "#dddddd",
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        top: 5,
        right: 20,
      },
    },
    fill: {
      opacity: 0.8,
    },
    tooltip: {
      theme: "dark",
    },
  },
};
console.log("here is he value of the user",user)
const usersid=user.uid;

  useEffect(() => {
    const fetchUserData = async () => {
      const userDocRef = doc(db, 'users', usersid);
      const userDocSnapshot = await getDoc(userDocRef);

      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        const userId = userData.userId;
        console.log('userId', userId);
        try {
          const response = await axios.get(`http://localhost:5050/api/users/${userId}`);
         // const { totalUsage, outstandingInvoices, uploadedFiles, usageRecords } = response.data;
           
         const totalUsage = response.data.totalUsage;
         const outstandingInvoices = response.data.outstandingInvoiceData || [];
         const uploadedFiles = response.data.uploadedFiles;
         const usageRecords = response.data.usageRecords || [];

          console.log("here are the response",response.data)
         // const invoices =outstandingInvoices.data.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
          
           //check if the res data for the usage data is returned ny the server
           if (!usageRecords || usageRecords.length === 0) {
            console.log('No  data returned by the server');
            return [];  
          }

         setStoredFileData((prevData) => [...prevData, fileData]);
         setUsageRecords(usageRecords);

         const prepareChartData = (usageRecords) => {

          if (!usageRecords || usageRecords.length === 0) {
            return [];
          }
         
           const data = [];
           usageRecords.forEach((record) => {
             const timestamp = new Date(record.timestamp);
             const hour = timestamp.getHours();
             const fileSize = record.fileSize / (1024 * 1024); // Convert to MB
         
             // Check if fileSize is a valid number
             if (!isNaN(fileSize)) {
               data.push({ x: hour, y: fileSize });
             }
           });
           return data;
         };

         setChartData(prepareChartData(usageRecords));
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
  }, [usersid,fileData]);


  const handleDownloadClick = async (fileData) => {
    const { fileId, fileName } = fileData;
    console.log('fileID', fileId, 'fileName', fileName)
  
    if (!fileId || !fileName) {
      console.error('Invalid file data');
      return;
    }

    try {
      setIsLoading(true); 
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnapshot = await getDoc(userDocRef);
  
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        const userId = userData.userId;
        const firebaseUid = userId;
        console.log('userId for the frontend ', userId);
      /*  const response = await axios.get(`http://localhost:5050/download?firebaseUid=${firebaseUid}&fileId=${fileData.fileId}&fileName=${fileData.fileName}`);
        if (response.data.outstandingInvoices && response.data.outstandingInvoices.length > 0) {
          // Redirect to Stripe Checkout session URL
          const checkoutUrl = response.data.checkoutUrl;
          window.location.href = checkoutUrl;
        } else {
          // Display download link
          const downloadLink = response.data.downloadLink;
          window.open(downloadLink, '_blank');
        }*/
        const url = `http://localhost:5050/api/download?fileId=${fileId}&fileName=${fileName}&firebaseUid=${firebaseUid}`;

        const response = await axios.get(url);
        if (response.data.outstandingInvoices && response.data.outstandingInvoices.length > 0) {
          // Redirect to Stripe Checkout session URL
          const checkoutUrl = response.data.checkoutUrl;
          window.location.href = checkoutUrl;
        } else {
          // Display download link
          const downloadLink = response.data.downloadLink;
          const link = document.createElement('a');
          link.href = downloadLink;
          link.download = fileName; 
          link.click();
        //  window.open(downloadLink, '_blank');
        }
      } else {
        console.error('User data not found');
      }
    } catch (error) {
      console.error('Error initiating download:', error);
      alert('Failed to download file');
    }
   finally {
      setIsLoading(false);
  }
  };


  return (
    <>
    <div className="container mx-auto px-4">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <p>Total Data Usage: {totalUsage/1000000} GB </p>
      {outstandingInvoices.length > 0 && (
        <div>
          <h3 className="text-xl text-black font-bold mt-4 mb-2 ">Outstanding Invoices:</h3>
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
          </li>
        ))}
      </ul>
      <h3 className="text-xl font-bold mt-4 mb-2">File Data:</h3>
      <ul>
        {storedFileData.map((data, index) => (
          <li key={index} className="flex justify-between items-center 	text-wrap: wrap">
            <span className="truncate-text">{`File ID: ${data.fileId}, File Name: ${data.fileName}`}</span>
            <DownloadButtton 
            className="font-bold py-2 px-4 rounded "
             onClick={() => handleDownloadClick(fileData)} 
             isLoading={isLoading}
             />
          </li>
        ))}
      </ul>
    </div>
    <Card>
      <CardHeader
        floated={false}
        shadow={false}
        color="transparent"
        className="flex flex-col gap-4 rounded-none md:flex-row md:items-center"
      >
        <div className="w-max rounded-lg bg-gray-900 p-5 text-white">
          <Square3Stack3DIcon className="h-6 w-6" />
        </div>
        <div>
          <Typography variant="h6" color="blue-gray">
            Line Chart
          </Typography>
          <Typography
            variant="small"
            color="gray"
            className="max-w-sm font-normal"
          >
            Visualize your data in a simple way using the
            @material-tailwind/react chart plugin.
          </Typography>
        </div>
      </CardHeader>
      <CardBody className="px-2 pb-0">
        <Chart {...chartConfig} />
      </CardBody>
    </Card>
    </>
  );
};

