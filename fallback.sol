// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract concept
{
    bool private _fallback;
    bool private _receive;
    bool private _transaction;
    bytes private _calldata;

    fallback()external
    {
        _fallback = true;
    }

    receive()external payable
    {
        _receive = true;
    }

    function getValues()public view returns(bool receive_, bool fallback_,bool transaction_, bytes memory calldata_)
    {
        return(_receive, _fallback, _transaction, _calldata);
    }

    function reset()public
    {
        _receive = false;
        _fallback = false;
        _transaction = false;
    }

    function transaction()public
    {
        _transaction = true;
    }

    function setCalldata()public payable
    {
        _calldata = msg.data;
    }
}

// msg.value can only be used with "payable" functions...
// fallback is optional to fallback...
