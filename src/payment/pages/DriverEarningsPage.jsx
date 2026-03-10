import { useEffect, useState } from "react";
import theme from "../../theme";

import {
  getDriverPayments,
  getDriverCommission,
  settleDriverCommission
} from "../services/paymentService";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import CountUp from "react-countup";

export default function DriverEarningsPage() {

  const colors = theme.light.colors;
  const spacing = theme.base.spacing;
  const typography = theme.base.typography;
  const radius = theme.base.radius;
  const shadows = theme.base.shadows;

  const [earnings,setEarnings] = useState(0);
  const [commissionDue,setCommissionDue] = useState(0);
  const [payments,setPayments] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{

    async function fetchData(){

      try{

        const driverId = "DRIVER1";

        const paymentData = await getDriverPayments(driverId);
        const commissionData = await getDriverCommission(driverId);

        setPayments(paymentData || []);

        setEarnings(commissionData?.totalEarnings || 0);
        setCommissionDue(commissionData?.commissionDue || 0);

      }catch(err){

        console.error("Failed to load earnings",err);

      }finally{

        setLoading(false);

      }
    }

    fetchData();

  },[]);



  /* ============================
      MONTHLY STATS
  ============================ */

  const monthlyEarnings = payments
    .filter(p => {
      const d = new Date(p.createdAt);
      const now = new Date();
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum,p)=>sum + p.amount,0);

  const totalTrips = payments.length;



  /* ============================
      CHART DATA
  ============================ */

  const chartData = payments.map(p => ({
    date: p.createdAt
      ? new Date(p.createdAt).toLocaleDateString()
      : "Ride",
    amount: p.amount
  }));



  /* ============================
      COMMISSION SETTLEMENT
  ============================ */

  const handleSettlement = async () => {

    try{

      const result = await settleDriverCommission("DRIVER1");

      alert(`Commission Paid: ₹${result.paid}`);

      window.location.reload();

    }catch(err){

      console.error(err);

      alert("Failed to settle commission");

    }

  };



  if(loading){

    return (

      <div
        style={{
          padding:spacing.xxl,
          fontFamily:typography.fontFamily.primary
        }}
      >
        Loading earnings...
      </div>

    );
  }



  return (

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
          fontSize:typography.fontSize.h2,
          marginBottom:spacing.xl,
          color:colors.text.primary
        }}
      >
        Driver Earnings
      </h1>



      {/* ============================
          KPI CARDS
      ============================ */}

      <div
        style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
          gap:spacing.xl,
          marginBottom:spacing.xxl
        }}
      >

        {/* TOTAL EARNINGS */}

        <div
          style={{
            background:colors.surface,
            padding:spacing.lg,
            borderRadius:radius.lg,
            boxShadow:shadows.soft,
            border:`1px solid ${colors.border}`
          }}
        >

          <h4 style={{color:colors.text.secondary}}>
            Total Earnings
          </h4>

          <p
            style={{
              fontSize:"30px",
              fontWeight:"700",
              color:colors.text.primary
            }}
          >
            ₹<CountUp end={earnings} duration={1.5} separator=","/>
          </p>

        </div>



        {/* MONTHLY EARNINGS */}

        <div
          style={{
            background:colors.surface,
            padding:spacing.lg,
            borderRadius:radius.lg,
            boxShadow:shadows.soft,
            border:`1px solid ${colors.border}`
          }}
        >

          <h4 style={{color:colors.text.secondary}}>
            This Month
          </h4>

          <p
            style={{
              fontSize:"30px",
              fontWeight:"700",
              color:colors.primary
            }}
          >
            ₹<CountUp end={monthlyEarnings} duration={1.5}/>
          </p>

        </div>



        {/* TRIPS COMPLETED */}

        <div
          style={{
            background:colors.surface,
            padding:spacing.lg,
            borderRadius:radius.lg,
            boxShadow:shadows.soft,
            border:`1px solid ${colors.border}`
          }}
        >

          <h4 style={{color:colors.text.secondary}}>
            Trips Completed
          </h4>

          <p
            style={{
              fontSize:"30px",
              fontWeight:"700"
            }}
          >
            <CountUp end={totalTrips} duration={1.2}/>
          </p>

        </div>



        {/* COMMISSION DUE */}

        <div
          style={{
            background:colors.surface,
            padding:spacing.lg,
            borderRadius:radius.lg,
            boxShadow:shadows.soft,
            border:`1px solid ${colors.border}`
          }}
        >

          <h4 style={{color:colors.text.secondary}}>
            Commission Due
          </h4>

          <p
            style={{
              fontSize:"30px",
              fontWeight:"700",
              color:colors.status.error
            }}
          >
            ₹<CountUp end={commissionDue} duration={1.5}/>
          </p>

          {commissionDue > 0 && (

            <button
              onClick={handleSettlement}
              style={{
                marginTop:"12px",
                padding:"8px 16px",
                borderRadius:"999px",
                border:"none",
                background:colors.primary,
                color:colors.text.inverse,
                cursor:"pointer",
                fontWeight:"600"
              }}
            >
              Pay Commission
            </button>

          )}

        </div>

      </div>



      {/* ============================
          EARNINGS CHART
      ============================ */}

      <div
        style={{
          background:colors.surface,
          padding:spacing.lg,
          borderRadius:radius.lg,
          boxShadow:shadows.soft,
          border:`1px solid ${colors.border}`,
          marginBottom:spacing.xxl
        }}
      >

        <h2
          style={{
            marginBottom:spacing.md,
            color:colors.text.primary
          }}
        >
          Earnings Analytics
        </h2>

        <div style={{width:"100%",height:300}}>

          <ResponsiveContainer>

            <LineChart data={chartData}>

              <CartesianGrid
                stroke={colors.border}
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="date"
                stroke={colors.text.secondary}
              />

              <YAxis
                stroke={colors.text.secondary}
              />

              <Tooltip
                contentStyle={{
                  background:colors.surface,
                  border:`1px solid ${colors.border}`,
                  borderRadius:radius.md
                }}
              />

              <Line
                type="monotone"
                dataKey="amount"
                stroke={colors.primary}
                strokeWidth={3}
                dot={{r:4}}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </div>



      {/* ============================
          PAYMENT HISTORY
      ============================ */}

      <div
        style={{
          background:colors.surface,
          padding:spacing.lg,
          borderRadius:radius.lg,
          boxShadow:shadows.soft,
          border:`1px solid ${colors.border}`
        }}
      >

        <h2 style={{marginBottom:spacing.md}}>
          Payment History
        </h2>

        {payments.length === 0 ? (

          <p>No driver payments yet</p>

        ) : (

          <table
            style={{
              width:"100%",
              borderCollapse:"collapse"
            }}
          >

            <thead>

              <tr style={{borderBottom:`1px solid ${colors.border}`}}>
                <th align="left">Ride</th>
                <th align="left">Amount</th>
                <th align="left">Status</th>
                <th align="left">Transaction</th>
                <th align="left">Date</th>
              </tr>

            </thead>

            <tbody>

              {payments.map(p=>(

                <tr
                  key={p._id}
                  style={{
                    borderBottom:`1px solid ${colors.border}`
                  }}
                >

                  <td>{p.rideId}</td>
                  <td>₹{p.amount}</td>
                  <td>{p.status}</td>
                  <td>{p.transactionId || "-"}</td>
                  <td>
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString()
                      : "-"
                    }
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>

    </div>
  );
}