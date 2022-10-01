import "./App.css";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "./utils/messageContract.json";
import format from "date-fns/format";

import Button from "@mui/material/Button";
import {
  Alert,
  AlertTitle,
  AppBar,
  Box,
  Card,
  CardContent,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Container } from "@mui/system";
import { getParsedEthersError } from "@enzoferey/ethers-error-parser";

function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [message, setMessage] = useState();
  const [messageList, setMessageList] = useState([]);
  const theme = useTheme();
  const isMatch = useMediaQuery(theme.breakpoints.down("sm"));
  const [alert, setAlert] = useState(false);
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);

  // const contractAddress = "0x259f6B95C5f2D1E30d13746F4773276193697aCD";
  // const contractAddress = "0xB3cec6D9ae70328b6Ac10C8D5D10c1cF44D41F8A";
  const contractAddress = "0xb87f5e3443Ed57bc848FD7D20B98A1b2eB8C8307";
  const contarcABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("account: ", accounts);
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      messages();
    } catch (error) {
      console.log(error);
    }
  };

  const messages = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const secretMessageContract = new ethers.Contract(
          contractAddress,
          contarcABI,
          signer
        );
        let messagesArray = await secretMessageContract.getAllMessages();
        console.log("CHECK messagesArray: ", messagesArray);
        let filteredMessage = messagesArray
          .map((item) => ({
            address: item.sender,
            message: item.message,
            timestamp: format(new Date(item.timestamp * 1000), "PPpp"),
          }))
          .reverse();
        setMessageList(filteredMessage);
        console.log("retreived data: ", messagesArray);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (message === "") return;
    setLoading(true);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const secretMessageContract = new ethers.Contract(
          contractAddress,
          contarcABI,
          signer
        );
        const messageTxn = await secretMessageContract.sendMessage(message);
        await messageTxn.wait();
        setMessage("");
      }
    } catch (error) {
      setAlert(true);

      const parsedEthersError = getParsedEthersError(error);
      if (parsedEthersError.errorCode === "REJECTED_TRANSACTION") {
        setError(parsedEthersError.errorCode);
      } else {
        setError(parsedEthersError.context);
      }
      console.log("ERROR MESSAGE: ", parsedEthersError);
    }
    setLoading(false);
  };

  const updateAccount = (accounts) => {
    // console.log("account chnaged: : ", accounts);
    setCurrentAccount(accounts[0]);
  };

  useEffect(() => {
    window.ethereum?.on("accountsChanged", updateAccount);
    return () => {
      window.ethereum.removeListener("accountsChanged", updateAccount);
    };
  }, []);

  useEffect(() => {
    checkIfWalletIsConnected().then(() => {
      messages();
    });

    let secreMessageContract;
    const onNewMessage = (from, timestamp, message) => {
      setMessageList((prev) => [
        {
          address: from,
          timestamp: format(new Date(timestamp * 1000), "PPpp"),
          message: message,
        },
        ...prev,
      ]);
    };
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      secreMessageContract = new ethers.Contract(
        contractAddress,
        contarcABI,
        signer
      );
      secreMessageContract.on("NewMessage", onNewMessage);
      return () => {
        if (secreMessageContract) {
          secreMessageContract.off("NewMessage", onNewMessage);
        }
      };
    }
  }, []);

  return (
    <Box sx={{ height: "100%" }}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography
              variant="h5"
              // component="div"
              lineHeight={1}
              sx={{ flexGrow: 1, ml: isMatch ? 1 : 5 }}
            >
              DAPP
            </Typography>
            {currentAccount && (
              <Tooltip title={currentAccount}>
                <Typography
                  sx={{ cursor: "pointer", mr: isMatch ? 0 : 4 }}
                  textAlign="center"
                >
                  Logged in as: {currentAccount.substring(0, 5)}...
                </Typography>
              </Tooltip>
            )}

            {!currentAccount && (
              <Button color="inherit" onClick={() => connectWallet()}>
                Connect wallet
              </Button>
            )}
          </Toolbar>
        </AppBar>
      </Box>
      {/* <button onClick={messages}>Get Messages</button> */}
      <Box sx={{ background: "#fafafa", minHeight: "100%" }}>
        <Container>
          <Typography
            sx={{ textAlign: "center", pt: 2 }}
            color="#606060"
            variant="h4"
          >
            Write data to to blockchain using this dapp.
          </Typography>
          {alert && (
            <Alert severity="error" sx={{ mt: 3 }}>
              <AlertTitle>Error</AlertTitle>
              This is an error alert — <strong>{error}</strong>
            </Alert>
          )}
          <form onSubmit={sendMessage}>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              pt={3}
            >
              <TextField
                onFocus={() => setAlert(false)}
                fullWidth
                placeholder="enter secret message"
                value={message}
                multiline
                rows={3}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button
                sx={{ marginTop: 2 }}
                disabled={loading}
                variant="contained"
                type="submit"
              >
                Send Message
              </Button>
            </Box>
          </form>
          {messageList &&
            messageList.map((item, i) => (
              <Card key={i} sx={{ marginTop: 3, padding: 2 }}>
                <CardContent sx={{ pb: 0 }}>
                  <Typography sx={{ wordWrap: "break-word" }}>
                    By: {item.address}
                  </Typography>
                  <Typography>Message: {item.message}</Typography>
                  <Typography marginTop={1} variant="overline">
                    {item.timestamp}
                  </Typography>
                </CardContent>
              </Card>
            ))}
        </Container>
      </Box>
    </Box>
  );
}

export default App;
