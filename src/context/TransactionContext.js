import React, { createContext, useEffect, useState } from 'react';


import { ethers } from 'ethers';
import { contractABI, contractAddress } from '../utils/constants';

export const TransactionContext = createContext();

const { ethereum } = window;

const getEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const transactionsContract = new ethers.Contract(contractAddress, contractABI, signer);

    return transactionsContract;
}

export const TransactionProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [currentAccount, setCurrentAccount] = useState('');
    const [formData, setFormData] = useState({
        addressTo: '',
        amount: '',
        keyword: '',
        message: '',
    });
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'))
    const [transactions, setTransactions] = useState([])



    useEffect(() => {
        checkIfWalletIsConnected();
        checkIfTransactionsExist();
    }, []);

    const getAllTransactions = async () => {
        try {
            if (!ethereum) return alert("Please Install MetaMask");
            const transactionsContract = getEthereumContract();
            const availableTransactions = await transactionsContract.getAllTransactions()
            const structuredTransactions = availableTransactions?.map((transaction) => ({
                addressTo: transaction?.receiver,
                addressFrom: transaction?.sender,
                timestamp: new Date(transaction?.timestamp.toNumber() * 1000).toLocaleString(),
                message: transaction?.message,
                keyword: transaction?.keyword,
                amount: parseInt(transaction?.amount?._hex) / (10 ** 18)
            }))
            setTransactions(structuredTransactions)
            // console.log(structuredTransactions);
        } catch (error) {
            console.log(error);
        }
    }

    const checkIfWalletIsConnected = async () => {
        try {

            if (!ethereum) return alert("Please Install MetaMask");

            const accounts = await ethereum.request({ method: 'eth_accounts' });

            if (accounts.length) {
                setCurrentAccount(accounts[0])
                getAllTransactions();
            } else {
                console.log('No Accounts found');
            }
            // console.log(accounts?.[0]);
        } catch (error) {
            console.log(error);

            throw new Error('No Ethereum Object')
        }
    }

    const checkIfTransactionsExist = async () => {
        try {
            const transactionsContract = getEthereumContract();
            const transactionsCount = await transactionsContract.getTranscationCount();

            window.localStorage.setItem("transactionCount", transactionsCount)

        } catch (error) {
            console.log(error);

            throw new Error('No Ethereum Object')
        }
    }

    const connectWallet = async () => {
        try {
            if (!ethereum) return alert("Please Install MetaMask");
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

            setCurrentAccount(accounts[0])

        } catch (error) {
            console.log(error);

            throw new Error('No Ethereum Object')
        }
    }

    const sendTransaction = async () => {
        try {
            if (!ethereum) return alert("Please Install MetaMask");

            //get the data from form
            const { addressTo, amount, keyword, message } = formData;
            const transactionsContract = getEthereumContract();
            const parsedAmount = ethers.utils.parseEther(amount)

            await ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: currentAccount,
                    to: addressTo,
                    gas: '0x5208', // 2100 GWEI then convert into ethereum
                    value: parsedAmount._hex,
                }]
            })

            const transactionHash = await transactionsContract.addToBlockchain(addressTo, parsedAmount, message, keyword);

            setIsLoading(true);

            await transactionHash.wait()

            setIsLoading(false);

            const transactionsCount = await transactionsContract.getTranscationCount();
            setTransactionCount(transactionsCount.toString());

            window.location.reload();
        } catch (error) {
            console.log(error);

            throw new Error('No Ethereum Object')
        }
    }





    return (
        <TransactionContext.Provider value={{ isLoading, transactions, setIsLoading, connectWallet, currentAccount, setFormData, formData, sendTransaction }}>
            {children}
        </TransactionContext.Provider>
    )
} 