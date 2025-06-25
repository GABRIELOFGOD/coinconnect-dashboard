"use client";

import { useAuth } from "@/provider/authProvider";
import { API_URL } from "@/utils/constants";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const Paypal = () => {
  const { user } = useAuth();

  const [privateKey, setPrivateKey] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [loadingAddUrl, setLoadingAddUrl] = useState(false);

  useEffect(() => {
    if (user) {
      setPrivateKey(user?.private_fingerprint);
      setPublicKey(user?.public_fingerprint);
      setWebUrl(user?.url);
    }
  }, [user]);
  
  const addUrl = async () => {
    if (!webUrl) {
      toast.error("Enter your website Url");
      return;
    }
    try {
      setLoadingAddUrl(true);
      const token = localStorage.getItem("token");
      const req = await fetch(`${API_URL}/users/url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${token}`
        },
        body: JSON.stringify({url: webUrl})
      });

      const res = await req.json();
      console.log("[res]: ", res);
      if (res.status == "active") {
        toast.success(res.message);
      }
    } catch (error) {
      toast.error(error.detail || "");
      console.log("[ERROR]: ", error);
    } finally {
      setLoadingAddUrl(false);
    }
  }
  
  return (
    <div className='col-xxl-12'>
      <div className='card radius-12 shadow-none border overflow-hidden'>
        <div className='card-header bg-neutral-100 border-bottom py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between'>
          <div className='d-flex align-items-center gap-10'>
            {/* <span className='w-36-px h-36-px bg-base rounded-circle d-flex justify-content-center align-items-center'>
              <img
                src='assets/images/payment/payment-gateway1.png'
                alt=''
                className=''
              />
            </span> */}
            <span className='text-lg fw-semibold text-primary-light'>
              API keys
            </span>
          </div>
          <div className='form-switch switch-primary d-flex align-items-center justify-content-center'>
            <input
              className='form-check-input'
              type='checkbox'
              role='switch'
              defaultChecked=''
            />
          </div>
        </div>
        <div className='card-body p-24'>
          <div className='row gy-3'>
            <div className='col-sm-6'>
              <span className='form-label fw-semibold text-primary-light text-md mb-8'>
                Environment <span className='text-danger-600'>*</span>
              </span>
              <div className='d-flex align-items-center gap-3'>
                <div className='d-flex align-items-center gap-10 fw-medium text-lg'>
                  <div className='form-check style-check d-flex align-items-center'>
                    <input
                      className='form-check-input radius-4 border border-neutral-500'
                      type='checkbox'
                      name='checkbox'
                      id='sandbox'
                      defaultChecked=''
                    />
                  </div>
                  <label
                    htmlFor='sandbox'
                    className='form-label fw-medium text-lg text-primary-light mb-0'
                  >
                    Testnet
                  </label>
                </div>
                <div className='d-flex align-items-center gap-10 fw-medium text-lg'>
                  <div className='form-check style-check d-flex align-items-center'>
                    <input
                      className='form-check-input radius-4 border border-neutral-500'
                      type='checkbox'
                      name='checkbox'
                      id='Production'
                    />
                  </div>
                  <label
                    htmlFor='Production'
                    className='form-label fw-medium text-lg text-primary-light mb-0'
                  >
                    Mainnet
                  </label>
                </div>
              </div>
            </div>
            {/* <div className='col-sm-6'>
              <label
                htmlFor='currency'
                className='form-label fw-semibold text-primary-light text-md mb-8'
              >
                Currency
                <span className='text-danger-600'>*</span>
              </label>
              <select
                className='form-control radius-8 form-select'
                id='currency'
                defaultValue='USD'
              >
                <option value='USD'>USD</option>
                <option value='TK'>TK</option>
                <option value='Rupee'>Rupee</option>
              </select>
            </div> */}
            <div className="col-sm-6">
              <span className='form-label fw-semibold text-primary-light text-md mb-8'>
                Message Settings <span className='text-danger-600'>*</span>
              </span>
              <div className="d-flex gap-3">
                <input
                  className='form-check-input radius-4 border border-neutral-500 my-auto'
                  type='checkbox'
                  name='checkbox'
                  id='Production'
                />
                <div>
                  <p>Open Support chat</p>
                  <p>If you turn this settings off, users will not be able to reach you through our chat system.</p>
                </div>
              </div>
            </div>
            <div className='col-sm-12'>
              <label
                htmlFor='secretKey'
                className='form-label fw-semibold text-primary-light text-md mb-8'
              >
                Your website URL (with HTTPS)
                <span className='text-danger-600'>*</span>
              </label>
              <p className="text-sm">Please note that before you can change this, you can change this, you have to reach out to our support</p>
              <div className="d-flex gap-2">
                <div className='col-sm-9'>
                  <input
                    type='text'
                    className='form-control radius-8 col-sm-9'
                    id='secretKey'
                    placeholder='E.g: https://yourwebsite.com'
                    value={webUrl}
                    onChange={e=>setWebUrl(e.target.value)}
                  />
                </div>
                <div className='col-sm-3'>
                  <button
                    onClick={addUrl}
                    disabled={loadingAddUrl}
                    className='btn btn-primary border border-primary-600 text-md px-24 py-8 radius-8 w-100 text-center my-auto'
                  >
                    {loadingAddUrl ? "submitting" : "Add URL"}
                  </button>
                </div>
              </div>
            </div>
            {/* <div className='col-sm-3'>
              <button
                // type='submit'
                disabled={user?.url !== null & user?.url !== ""}
                className='btn btn-primary border border-primary-600 text-md px-24 py-8 radius-8 w-100 text-center my-auto'
              >
                Add URL
              </button>
            </div> */}
            <div className='col-sm-6'>
              <label
                htmlFor='secretKey'
                className='form-label fw-semibold text-primary-light text-md mb-8'
              >
                Secret Key
                <span className='text-danger-600'>*</span>
              </label>
              <input
                type='text'
                className='form-control radius-8'
                id='secretKey'
                placeholder='Secret Key'
                value={privateKey}
              />
            </div>
            <div className='col-sm-6'>
              <label
                htmlFor='publicKey'
                className='form-label fw-semibold text-primary-light text-md mb-8'
              >
                Publics Key<span className='text-danger-600'>*</span>
              </label>
              <input
                type='text'
                className='form-control radius-8'
                id='publicKey'
                placeholder='Publics Key'
                value={publicKey}
              />
            </div>
            {/* <div className='col-sm-6'>
              <label
                htmlFor='logo'
                className='form-label fw-semibold text-primary-light text-md mb-8'
              >
                Logo <span className='text-danger-600'>*</span>
              </label>
              <input type='file' className='form-control radius-8' id='logo' />
            </div> */}
            <div className='col-sm-6'>
              {/* <label
                htmlFor='logo'
                className='form-label fw-semibold text-primary-light text-md mb-8'
              >
                <span className='visibility-hidden'>Save</span>
              </label> */}
              <button
                // type='submit'
                disabled
                className='btn btn-primary border border-primary-600 text-md px-24 py-8 radius-8 w-100 text-center'
              >
                Read Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Paypal;
