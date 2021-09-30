import { useEffect, useState } from "react";
import Image from 'next/image';
import styled from "styled-components";
import Countdown from "react-countdown";
import 'tailwindcss/tailwind.css';
import froggies from './images/Froggies.gif';
import { Button, CircularProgress, Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import { Helmet } from 'react-helmet';

import * as anchor from "@project-serum/anchor";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";

import {
  CandyMachine,
  awaitTransactionSignatureConfirmation,
  getCandyMachineState,
  mintOneToken,
  shortenAddress,
} from "./candy-machine";

const ConnectButton = styled(WalletDialogButton)``;

const CounterText = styled.span``; // add your styles here

const MintContainer = styled.div``; // add your no styles here

const MintButton = styled.button`mx-auto border-black border px-3 py-2 text-black border-6 font-bold bg-white rounded-md text-lg shadow-md shadow-offset-black items-center`; // add your styles here

export interface HomeProps {
  candyMachineId: anchor.web3.PublicKey;
  config: anchor.web3.PublicKey;
  connection: anchor.web3.Connection;
  startDate: number;
  treasury: anchor.web3.PublicKey;
  txTimeout: number;
}

const Home = (props: HomeProps) => {
  const [balance, setBalance] = useState<number>();
  const [isActive, setIsActive] = useState(false); // true when countdown completes
  const [isSoldOut, setIsSoldOut] = useState(false); // true when items remaining is zero
  const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const [startDate, setStartDate] = useState(new Date(props.startDate));

  const wallet = useWallet();
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();

  const onMint = async () => {
    try {
      setIsMinting(true);
      if (wallet.connected && candyMachine?.program && wallet.publicKey) {
        const mintTxId = await mintOneToken(
          candyMachine,
          props.config,
          wallet.publicKey,
          props.treasury
        );

        const status = await awaitTransactionSignatureConfirmation(
          mintTxId,
          props.txTimeout,
          props.connection,
          "singleGossip",
          false
        );

        if (!status?.err) {
          setAlertState({
            open: true,
            message: "Congratulations! Mint succeeded!",
            severity: "success",
          });
        } else {
          setAlertState({
            open: true,
            message: "Mint failed! Please try again!",
            severity: "error",
          });
        }
      }
    } catch (error: any) {
      // TODO: blech:
      let message = error.msg || "Minting failed! Please try again!";
      if (!error.msg) {
        if (error.message.indexOf("0x138")) {
        } else if (error.message.indexOf("0x137")) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf("0x135")) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          setIsSoldOut(true);
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      setAlertState({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      if (wallet?.publicKey) {
        const balance = await props.connection.getBalance(wallet?.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
      setIsMinting(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (wallet?.publicKey) {
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
    })();
  }, [wallet, props.connection]);

  useEffect(() => {
    (async () => {
      if (
        !wallet ||
        !wallet.publicKey ||
        !wallet.signAllTransactions ||
        !wallet.signTransaction
      ) {
        return;
      }

      const anchorWallet = {
        publicKey: wallet.publicKey,
        signAllTransactions: wallet.signAllTransactions,
        signTransaction: wallet.signTransaction,
      } as anchor.Wallet;

      const { candyMachine, goLiveDate, itemsRemaining } =
        await getCandyMachineState(
          anchorWallet,
          props.candyMachineId,
          props.connection
        );

      setIsSoldOut(itemsRemaining === 0);
      setStartDate(goLiveDate);
      setCandyMachine(candyMachine);
    })();
  }, [wallet, props.candyMachineId, props.connection]);

  return (
    <main>
      <Helmet>
        <title>Crypto Froggies</title>
        <meta property="og:title" content="Crypto Froggies" key="title" />
      </Helmet>
      <div className="relative flex flex-col h-screen overflow-x-hidden">
        <div className="animate-bounce absolute bottom-2 left-20 w-40">
          <p className="absolute -left-7 -top-10 text-white transform rotate-2">scroll down for more information!</p>
        {/* Down arrow svg */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="white">
          <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        </div>
        <div className="animate-cloud flex-none absolute top-20 z-10 overflow-y-hidden">
          <img className="" width="200" height="120" src="/cloud.png" alt="cloud"/>
        </div>
        <div className="animate-cloudslow flex-none absolute top-30 left-60 z-0 overflow-y-hidden">
          <img className="" width="200" height="120" src="/cloud.png" alt="cloud"/>
        </div>
        <div className="animate-cloudslow flex-none absolute top-30 -left-80 z-0 overflow-y-hidden">
          <img className="" width="200" height="120" src="/cloud.png" alt="cloud"/>
        </div>
        <div className="items-center justify-center mx-auto h-auto w-64 z-10">
          <img src="/logo_highres.png" width="1000" height="500" alt="cloud"/>
        </div>
        <div className="items-center justify-center mx-auto my-1 border-white border-8 z-20 image-fix">
            <img className="" src={froggies} width="250" height="250" alt="Froggies"/>
        </div>
        <div className="font-sans w-4/5 md:w-2/5 mx-auto z-10">  
          <h2 className="font-black text-white md:text-3xl text-2xl text-center md:text-center my-3">A NEW TYPE OF NFT GAME.</h2>
            <p className="text-lg font-light text-gray text-center md:w-3/3 text-white my-3 md:my-0">
            Welcome to the world of <b>Crypto Froggies</b>, a future online MMORPG where your character is a fully upgradble NFT living on the Solana blockchain!
            </p>
            <p className="text-lg font-light text-gray text-center md:w-3/3 text-white my-3 md:my-3">
            Battle fierce creatures or spend your time learning about the world completing quests all while being rewarded earning our
            very own token Swamp Gold.
            </p>
            <p className="text-lg font-light text-gray text-center md:w-3/3 text-white my-3 md:my-3">
            <b> Join our Discord and become a part of our community!</b>
            </p>
            <div className="flex flex-col items-center justify-center md:my-6">
              <MintContainer>
        {!wallet.connected ? (
          <ConnectButton>Connect Wallet</ConnectButton>
        ) : (
          <div>
            <button disabled={isSoldOut || isMinting || !isActive} className="mx-auto border-black border px-3 py-2 text-black border-6 font-bold bg-white rounded-md text-lg shadow-md shadow-offset-black items-center" onClick={ (e) => { onMint() } }>
              {isSoldOut ? (
              "SOLD OUT"
            ) : isActive ? (
              isMinting ? (
                <CircularProgress />
              ) : (
                "MINT"
              )
            ) : (
              <Countdown
                date={startDate}
                onMount={({ completed }) => completed && setIsActive(true)}
                onComplete={() => setIsActive(true)}
                renderer={renderCounter}
              />
            )}
              </button>
            
          </div>
        )}
      </MintContainer>
              
              
              {wallet.connected && (
                <div className="bg-white opacity-50 mx-auto my-2 text-center top-5 z-20 p-3 shadow-md shadow-offset-black">Connected {shortenAddress(wallet.publicKey?.toBase58() || "")}</div>
              )}
              <p className="text-white font-sans">0/1000 minted (Sale not live)</p>
              <span className="my-3">
                <a href="https://twitter.com/pixlfrogsnft" target="_blank" rel="noreferrer"><img className="w-9 mx-4 inline" width="64" height="64" alt="Twitter Logo" src="/twitter.png"/></a>
                <a href="https://t.co/JLzkwX6oH1?amp=1" target="_blank" rel="noreferrer"><img className="w-8 mx-1 inline" alt="Discord link" src="/discord.png" width="64" height="64"/></a>
              </span>
            </div>
         </div>
         <div className="font-sans w-4/5 md:w-2/5 mx-auto z-10 bg-black">  
           <h2 className="font-black text-white md:text-3xl text-2xl text-center md:text-center my-3">Why mint a Generation 0?</h2>
         </div>
         <div className="flex flex-col md:flex-row relative font-sans w-4/5 md:w-2/5 mx-auto z-10 py-3">
            <div>
              <p className="text-lg font-light text-center md:text-left md:w-2/3 text-white my-12">
                <b>Generation 0 Froggies will have some very special traits</b> in the upcoming game, ranging from being airdropped LAND to unique armour and titles! 
              </p>
              <p className="text-lg font-light text-center md:text-left md:w-2/3 text-white my-12">
                Become one of the first LAND owners within the Kingdom of Funguia and recieve a % of TAX from people using shops within your owned area.
              </p> 
              <p className="text-lg font-light text-center md:text-left md:w-2/3 text-white my-12">
                Get paid in Swamp Gold just for owning some LAND in our game that you get FOR FREE for holding a GEN 0 froggie. 
              </p>   
            </div>
            <div className="mx-auto md:mx-0 md:absolute md:-right-16 md:top-10 md:transform md:rotate-3 md:border-8 md:border-white img-fix">
              <img className="p-0 m-0" src="/31.png" width="250" height="250" alt="Rare Froggies"/>
            </div>
            <div className="mx-auto md:mx-0 md:absolute md:-right-24 md:top-6 md:transform md:rotate-3 md:border-8 md:border-white img-fix">
              <img className="p-0 m-0" src="/10.png" width="250" height="250" alt="Rare Froggies"/>
            </div>
         </div>
         <div className="font-sans w-4/5 md:w-2/5 mx-auto z-10 bg-black">  
           <h2 className="font-black text-white md:text-3xl text-2xl text-center md:text-center my-3">Whats my Rarity?</h2>
         </div>
         <div className="flex flex-col md:flex-row relative font-sans w-4/5 md:w-2/5 mx-auto z-10 py-3">
            <div>
              <p className="text-md font-light text-center md:text-left md:w-2/3 text-white my-12">
                Every <b>Crypto Froggie</b> is minted with a completely random &quot;Item Level&quot; value between 0 and 1 for Generation 0 Froggies 📊. This is something
                completely unique to the space and has never been done before. <b>We are creating upgradable NFT&quot;s through our game.🔥🔥</b>
              </p>
              <p className="text-md font-light text-center md:text-left md:w-2/3 text-white my-12">
                The higher the Item Level value on each Crypto Froggie will have access to <b>higher gear and higher level adventures</b>, therefor allowing you 
                to receive better loot and fight higher level monsters!
              </p>
              <p className="text-md font-light text-center md:text-left md:w-2/3 text-white my-12">
               Each Crypto Froggie is generated at Random from over 100+ traits! So you know for sure yours will be 100% unique.
              </p> 
              <p className="text-md font-light text-center md:text-left md:w-2/3 text-white my-12">
                What is this game? Read more below.
              </p>   
            </div>
         </div>
         <div className="font-sans w-4/5 md:w-2/5 mx-auto z-10 bg-black">  
           <h2 className="font-black text-white md:text-3xl text-2xl text-center my-3">The Game.</h2>
         </div>
         <div className="flex flex-col md:flex-row relative font-sans w-4/5 md:w-2/5 mx-auto z-10 py-3">
            <div>
              <p className="text-md font-light text-center md:text-right text-white my-12">
              <b>Crypto Froggies</b> is a brand new Play To Earn NFT based MMORPG game running on the Solana blockchain 💰.  Featuring the very first up-gradable NFT&quot;s. Send your froggies on adventures and be rewarded with our very own <b>Token &quot;Swamp Gold&quot;!</b>
              </p>
              <p className="text-md font-light text-center md:text-right text-white my-12">
              You will be able to log in and go on adventures, talk to your friends, kill monsters an level up. All while being rewarded in Swamp Gold tokens. You can either sell these tokens or use them to further upgrade your character!
              </p> 
              <p className="text-md font-light text-center md:text-right md:w-2/3 text-white my-12">
                🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀
              </p>   
            </div>
         </div>
         <div className="font-sans w-4/5 md:w-2/5 mx-auto z-10 bg-black">  
           <h2 className="font-black text-white md:text-3xl text-2xl text-center my-3">The Roadmap.</h2>
         </div>
         <div className="hidden lg:flex flex-col md:flex-row relative font-sans w-4/5 md:w-2/5 mx-auto z-10 py-3">
         <div className="timeline mx-auto font-sans">
              <div className="container left">
                <div className="date lg:-mx-8">1st Phase</div>
                <i className="icon fa fa-home border-2 border-white"></i>
                <div className="content text-white">
                  <p className="font-sans font-light text-center">
                    Release Crypto Froggies Generation 0 NFT
                  </p>
                </div>
              </div>
              <div className="container right">
                <div className="date lg:-mx-8">2nd Phase</div>
                <i className="icon fa fa-gift"></i>
                <div className="content right">
                  <p className="font-sans font-light text-center text-white">
                    Airdrop holders <b className="font-bold">*THE LAND*</b>
                  </p>
                </div>
              </div>
              <div className="container left">
                <div className="date lg:-mx-8">3rd Phase</div>
                <i className="icon fa fa-home border-2 border-white"></i>
                <div className="content text-white">
                  <p className="font-sans font-light text-center">
                    Release beta version for early holders.
                  </p>
                </div>
              </div>
              <div className="container right">
                <div className="date lg:-mx-8">4th Phase</div>
                <i className="icon fa fa-gift"></i>
                <div className="content">
                  <p className="font-sans font-light text-center text-white">
                    Unlock full Crypto Froggies Web App for general public use
                  </p>
                </div>
              </div>
            </div>
         </div>
         <div className="lg:hidden flex-col relative font-sans mx-auto my-10">
           <div className="border-l-2 border-white absolute left-1/2 -top-9 h-8"></div>
           <div className="bg-black w-4/5 mx-auto p-5 ">
                <div className="text-center text-white">1st Phase</div>
                <div className="text-white">
                  <p className="font-sans font-light text-center">
                    Release Crypto Froggies Generation 0 NFT
                  </p>
                </div>
           </div>
           <div className="border-l-2 border-white absolute left-1/2 top-24 z-0 h-8"></div>
           <div className="bg-black w-4/5 mx-auto my-12 p-5 z-20">
                <div className="text-center text-white">2nd Phase</div>
                <div className="text-white">
                  <p className="font-sans font-light text-center">
                    Airdrop holders <b className="font-bold">*THE LAND*</b>
                  </p>
                </div>
           </div>
           <div className="border-l-2 border-white absolute left-1/2 top-56 my-2 h-8 z-0"></div>
           <div className="bg-black w-4/5 mx-auto my-10 p-5 z-10">
                <div className="text-center text-white">3rd Phase</div>
                <div className="text-white">
                  <p className="font-sans font-light text-center">
                    Release beta version for early holders.
                  </p>
                </div>
           </div>
           <div className="border-l-2 border-white absolute left-1/2 bottom-40 -my-1 h-8"></div>
           <div className="bg-black w-4/5 mx-auto my-10 p-5">
                <div className="text-center text-white">4th Phase</div>
                <div className="text-white">
                  <p className="font-sans font-light text-center">
                    Unlock full Crypto Froggies Web App for general public use
                  </p>
                </div>
           </div>
         </div>
         <div className="flex justify-center space-x-16 bg-black">
        <div className="text-white font-semibold my-auto">CRYPTO FROGGIES - Made with ❤️ by Crypto Froggies Lab</div>
        <div className=""></div>
        <div className="">
          <a href="https://twitter.com/pixlfrogsnft" target="_blank" rel="noreferrer"><img className="w-9 mx-4 inline" width="42" height="42" alt="Twitter Logo" src="/twitter.png"/></a>
          <a href="https://t.co/JLzkwX6oH1?amp=1" target="_blank" rel="noreferrer"><img className="w-8 mx-1 inline" alt="Discord link" src="/discord.png" width="42" height="42"/></a>
        </div>
      </div>
      </div>
      

      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({ ...alertState, open: false })}
      >
        <Alert
          onClose={() => setAlertState({ ...alertState, open: false })}
          severity={alertState.severity}
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </main>
  );
};

interface AlertState {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error" | undefined;
}

const renderCounter = ({ days, hours, minutes, seconds, completed }: any) => {
  return (
    <CounterText>
      {days} days, {hours} hours, {minutes} minutes, {seconds} seconds
    </CounterText>
  );
};

export default Home;
