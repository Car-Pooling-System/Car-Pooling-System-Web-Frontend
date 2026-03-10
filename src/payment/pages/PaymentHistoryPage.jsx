import { useEffect, useState } from "react";
import { getPassengerHistory } from "../services/paymentService";
import theme from "../../theme";

export default function PaymentHistoryPage(){

  const colors = theme.light.colors;
  const spacing = theme.base.spacing;
  const typography = theme.base.typography;

  const [payments,setPayments] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);

  useEffect(()=>{

    const loadPayments = async () => {

      try{

        const data = await getPassengerHistory("USER1");

        if(Array.isArray(data)){
          setPayments(data);
        }else{
          setPayments([]);
        }

      }catch(e){

        console.error(e);
        setError("Failed to load payment history");

      }finally{

        setLoading(false);

      }

    };

    loadPayments();

  },[]);

  if(loading){
    return (
      <div style={{padding:40}}>
        Loading payments...
      </div>
    )
  }

  if(error){
    return (
      <div style={{padding:40,color:"red"}}>
        {error}
      </div>
    )
  }

  return(

    <div
      style={{
        background:colors.background,
        minHeight:"100vh",
        padding:spacing.xxl,
        fontFamily:typography.fontFamily.primary
      }}
    >

      <h1
        style={{
          fontSize:typography.fontSize.h3,
          marginBottom:spacing.xl
        }}
      >
        Payment History
      </h1>

      {payments.length === 0 && (

        <p>No payments found</p>

      )}

      {payments.map(payment => (

        <div
          key={payment._id}
          style={{
            background:colors.surface,
            padding:spacing.lg,
            borderRadius:12,
            marginBottom:spacing.md,
            border:`1px solid ${colors.border}`
          }}
        >

          <p><b>Ride:</b> {payment.rideId}</p>

          <p><b>Amount:</b> ₹{payment.amount}</p>

          <p><b>Status:</b> {payment.status}</p>

          {payment.transactionId && (
            <p><b>Transaction ID:</b> {payment.transactionId}</p>
          )}

          {payment.paymentMethod && (
            <p><b>Method:</b> {payment.paymentMethod}</p>
          )}

          <p>
            <b>Date:</b>{" "}
            {payment.createdAt
              ? new Date(payment.createdAt).toLocaleDateString()
              : "N/A"}
          </p>

        </div>

      ))}

    </div>
  )

}