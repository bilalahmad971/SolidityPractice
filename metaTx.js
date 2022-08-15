// --------------Configurations-------------------------
const Web3 = require('web3');
let ethUtil = require('ethereumjs-util'); // 'ethereumjs-util' is a collection of utility functions for Ethereum
let sigUtil  = require('eth-sig-util'); // 'eth-sig-util' is a small collection of Ethereum signing functions
const token_abi = require('./build/contracts/WETH.json');
const meta_abi = require('./build/contracts/Proxy.json');
const BigNumber = require('bignumber.js');
const { EIP712Domain } = require('./helper.js');
var web3;
const token_address = "0x0Fa815310a4745946cbfA67AB795c8b4862143ef";
const meta_address  = "0x4ffBAA721199Ba5c249758F095034AA7539593Ce";
const signerAddress = "0x95818F22eD28cB353164C7bb2e8f6B24e377d2ce";
const senderAddress = "0x9d12687d1CC9b648904eD837983c51d68Be25656";
const signerPK = "4ff4c1f54ffc9172aca57bd22fff489c79d0a5ed42e691f84926e9e93a916ba5";
const senderPK = "ced1344fd2ab0465a3ee0a763b963a25eecfbe96cc0d8a815a2423983567a641";
// const BigNumber = require('bignumber.js'); // Add the bignumber.js node package

async function connectBlockchain()
{
    url = "https://api.avax-test.network/ext/bc/C/rpc";
    // url = "https://bsc-dataseed.binance.org/";
    try
    {
        web3 = new Web3(url);
    }
    catch(error)
    {
        console.log(error.message)
    }

    // making contract instance...
    const Token_abi = token_abi.abi;
    const Meta_abi = meta_abi.abi;
    token = new web3.eth.Contract(Token_abi, token_address);
    meta = new web3.eth.Contract(Meta_abi, meta_address);
    
}

async function signOfflineTX(nonceSigner)
{
    const tx = 
    {
        from: signerAddress,
        to:  token_address,
        gas : 800000,
        value: 0,
        nonce: nonceSigner,
        data: token.methods.transfer(senderAddress, 1e9).encodeABI()
    };
    var signed_transaction = await web3.eth.accounts.sign(
        tx, signerPK);
    return signed_transaction;
}

async function Execute(_data, nonceSender)
{
    const tx = {
        from: signerAddress,
        to: meta_address,
        gas : 4712388,
        value: 0,
        nonce: nonceSender,
        data: meta.methods.forward(token_address, _data).encodeABI(),
    };
    var signed_transaction = await web3.eth.accounts.signTransaction(
    tx, signerPK);
    var success = await web3.eth.sendSignedTransaction(signed_transaction.rawTransaction);
    return success;
}


    async function recoverSigner1(signedtx)
    {
        var recoveredSigner = await web3.eth.accounts.recover(signedtx)
        return recoveredSigner;
    }
    async function recoverSigner2(forwardRequest, signature)
    {
        var recoveredSigner = ethUtil.toChecksumAddress(sigUtil.recoverTypedSignature_v4({data: forwardRequest, sig: signature}));
        return recoveredSigner;
    }

    async function verifyContract(signedtx)
    {
        return (await meta.methods.verify(signedtx.message, signedtx.signature).call());
    }

    async function getNonce(user)
    {
        let nonce = await meta.methods.getNonce(user).call();
        return nonce;
    }
    async function CreatetypedData()
    {
        const name = "MinimalForwarder";
        const version = "0.0.1";
        const chainId = 43114;
        const from = signerAddress;
        const to = token_address;
        const value = 0;
        const gas = 8000000;
        let tokenValue = new BigNumber(1 ** 18);
        let nonce = await getNonce(signerAddress);
        const verifyingContract = meta_address;
        nonce = parseInt(nonce);

        let fnSignatureTransfer = web3.utils.keccak256('transfer(address,uint256)').substr(0, 10);
        // Encode the function parameters
        let fnParamsTransfer = web3.eth.abi.encodeParameters(
            ['address', 'uint256'],
            [signerAddress, senderAddress, tokenValue]
            );
            data = fnSignatureTransfer + fnParamsTransfer.substr(2);
           // console.log("data: ", data);
            const ForwardRequest = [
                { name: 'from', type: 'address' },
                { name: 'to', type: 'address' },
                { name: 'value', type: 'uint256' },
                { name: 'gas', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'data', type: 'bytes' },
              ];
              
              // Defining the ForwardRequest data struct values as function of `verifyingContract` address 
            //   const buildData = (verifyingContract) => ({
            //     primaryType: 'ForwardRequest',
            //     types: { EIP712Domain, ForwardRequest },
            //     domain: { name, version, chainId, verifyingContract },
            //     message: { from, to, value, gas, nonce, data },
            //   });
            //   const forwardRequest = buildData(meta_address);
            const typedData = {
                primaryType: 'ForwardRequest',
                types: { EIP712Domain, ForwardRequest },
                domain: { name, version, chainId, verifyingContract },
                message: { from, to, value, gas, nonce, data },
              };
            return typedData;

    }
    async function getSignature(forwardRequest)
    {

        // // All problem exists here
        const signature = sigUtil.signTypedData_v4(Buffer.from(signerPK, 'hex'), { data: forwardRequest });
        return signature;
        // web3.currentProvider.sendAsync(
        //     {
        //         method: "eth_signTypedData_v3",
        //         params: [signerPK, forwardRequest.message],
        //         from: signerPK
        //     },
        //     function(err, result) {
        //         if (err) {
        //             return console.error(err);
        //         }
        //         const signature = result.result.substring(2);
        //         const r = "0x" + signature.substring(0, 64);
        //         const s = "0x" + signature.substring(64, 128);
        //         const v = parseInt(signature.substring(128, 130), 16);
        //         // The signature is now comprised of r, s, and v.
        //         }
        //     );
    }
async function main()
{
    await connectBlockchain();
    
    // const nonceSigner =  await web3.eth.getTransactionCount(signerAddress, 'latest');
    // const nonceSender = await web3.eth.getTransactionCount(senderAddress, 'latest');

    // const nonceSigner = await meta.methods.getNonce(signerAddress).call();
    // //const nonceSender = await meta.methods.getNonce(senderAddress).call();

    // var nonceSigner = await getNonce(signerAddress);
    // var signedtx = await signOfflineTX(parseInt(nonceSigner));
    //console.log("transaction :", signedtx);
    // var typedData  = await CreatetypedData();
    // var signature = await getSignature(typedData);
    // console.log(typedData);
    // console.log(signature);
    // // let signature2 = await getSignature(_transaction);
    // // console.log("signature :", signature2);

    // let signer2 = await recoverSigner2(typedData, signature);
    // console.log("signer2 v4", signer2);
    // // let signer1 = await recoverSigner1(signedtx);
    // // console.log("signer1", signer1);
    // //console.log(typedData);
    // //console.log(_transaction);
    // let fnSignatureTransfer = web3.utils.keccak256('transfer(address,uint256)').substr(0, 10);
    //     // Encode the function parameters
    //     let fnParamsTransfer = web3.eth.abi.encodeParameters(
    //         ['address', 'uint256'],
    //         [ senderAddress, 1]
    //         );
    //         data = fnSignatureTransfer + fnParamsTransfer.substr(2);
    //         console.log(data);
    
    // data = token.methods.transfer(senderAddress, 1e9).encodeABI();
    // // prepare data by signing from address...
    // let result = await Execute(data, nonceSigner);
    // // result = await meta.methods.verifySignature(token_address, data, signedtx.signature).call();
    // console.log("signer of Data: ", result);
}

main();