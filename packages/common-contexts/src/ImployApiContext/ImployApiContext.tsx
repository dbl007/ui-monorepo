import { useWeb3 } from "@chainsafe/web3-context"
import * as React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { IImployApiClient, ImployApiClient, Token, Provider } from "@imploy/api-client"
import jwtDecode from "jwt-decode"
import { signMessage } from "./utils"
import axios from "axios"
import { decryptFile, encryptFile } from "../helpers"

export { Provider as OAuthProvider }

const testLocalStorage = () => {
  try {
    localStorage.setItem("test", "test")
    localStorage.removeItem("test")
    return true
  } catch (e) {
    return false
  }
}

const tokenStorageKey = "csf.refreshToken"
const isReturningUserStorageKey = "csf.isReturningUser"

type ImployApiContextProps = {
  apiUrl?: string
  children: React.ReactNode | React.ReactNode[]
}

type ImployApiContext = {
  imployApiClient: IImployApiClient
  isLoggedIn: boolean | undefined
  secured: boolean | undefined
  isReturningUser: boolean
  selectWallet(): Promise<void>
  resetAndSelectWallet(): Promise<void>
  secureAccount(masterPassword: string): Promise<boolean>
  secureThresholdKeyAccount(encryptedKey: string): Promise<boolean>
  web3Login(): Promise<void>
  thresholdKeyLogin(
    signature: string,
    token: string,
    publicAddress: string,
  ): Promise<void>
  getProviderUrl(provider: Provider): Promise<string>
  loginWithGithub(code: string, state: string): Promise<void>
  loginWithGoogle(
    code: string,
    state: string,
    scope: string | undefined,
    authUser: string | undefined,
    hd: string | undefined,
    prompt: string | undefined,
  ): Promise<void>
  loginWithFacebook(code: string, state: string): Promise<void>
  logout(): void
  validateMasterPassword(candidatePassword: string): Promise<boolean>
  encrypedEncryptionKey?: string
}

const ImployApiContext = React.createContext<ImployApiContext | undefined>(undefined)

const ImployApiProvider = ({ apiUrl, children }: ImployApiContextProps) => {
  const maintenanceMode = process.env.REACT_APP_MAINTENANCE_MODE === 'true'

  const { wallet, onboard, checkIsReady, isReady, provider } = useWeb3()
  const canUseLocalStorage = useMemo(() => testLocalStorage(), [])
  // initializing api
  const initialAxiosInstance = useMemo(() => axios.create({
    // Disable the internal Axios JSON de serialization as this is handled by the client
    transformResponse: []
  }),[])

  const initialApiClient = useMemo(() => {
    return new ImployApiClient({}, apiUrl, initialAxiosInstance)
  },[apiUrl, initialAxiosInstance]
  )

  const [imployApiClient, setImployApiClient] = useState<ImployApiClient>(initialApiClient)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  // access tokens
  const [accessToken, setAccessToken] = useState<Token | undefined>(undefined)
  const [secured, setSecured] = useState<boolean | undefined>(undefined)
  const [refreshToken, setRefreshToken] = useState<Token | undefined>(undefined)
  const [decodedRefreshToken, setDecodedRefreshToken] = useState<
    { exp: number; mps?: string; uuid: string } | undefined
  >(undefined)

  // returning user
  const isReturningUserLocal =
    canUseLocalStorage && localStorage.getItem(isReturningUserStorageKey)
  const [isReturningUser, setIsReturningUser] = useState(
    isReturningUserLocal ? true : false
  )
  const axiosInstance = useMemo(() => 
    axios.create({
      // Disable the internal Axios JSON de serialization as this is handled by the client
      transformResponse: []
    })
  ,[])

  const setTokensAndSave = useCallback((accessToken: Token, refreshToken: Token) => {
    setAccessToken(accessToken)
    setRefreshToken(refreshToken)
    refreshToken.token && canUseLocalStorage && localStorage.setItem(tokenStorageKey, refreshToken.token)
    accessToken.token && imployApiClient.setToken(accessToken.token)
  }, [canUseLocalStorage, imployApiClient])

  const setReturningUser = () => {
    // set returning user
    canUseLocalStorage && localStorage.setItem(isReturningUserStorageKey, "returning")
    setIsReturningUser(true)
  }

  useEffect(() => {
    const initializeApiClient = async () => {

      axiosInstance.interceptors.response.use(
        (response) => {
          return response
        },
        async (error) => {
          if (!error.config._retry && error.response.status === 401) {
            error.config._retry = true
            const refreshTokenLocal = canUseLocalStorage && localStorage.getItem(tokenStorageKey)

            if (refreshTokenLocal) {
              const refreshTokenApiClient = new ImployApiClient({}, apiUrl, axiosInstance)
              try {
                const { access_token, refresh_token } = await refreshTokenApiClient.getRefreshToken({ refresh: refreshTokenLocal })

                setTokensAndSave(access_token, refresh_token)
                error.response.config.headers.Authorization = `Bearer ${access_token.token}`
                return axios(error.response.config)
              } catch (err) {
                canUseLocalStorage && localStorage.removeItem(tokenStorageKey)
                setRefreshToken(undefined)
                return Promise.reject(error)
              }
            } else {
              canUseLocalStorage && localStorage.removeItem(tokenStorageKey)
              setRefreshToken(undefined)
              return Promise.reject(error)
            }
          }
          return Promise.reject(error)
        }
      )
      const savedRefreshToken =
        !maintenanceMode && canUseLocalStorage && localStorage.getItem(tokenStorageKey)
      const apiClient = new ImployApiClient({}, apiUrl, axiosInstance)
      setImployApiClient(apiClient)
      if (savedRefreshToken) {
        try {
          const {
            access_token,
            refresh_token,
          } = await apiClient.getRefreshToken({ refresh: savedRefreshToken })

          setTokensAndSave(access_token, refresh_token)
        } catch (error) {}
      }
      setIsLoadingUser(false)
    }

    initializeApiClient()
  }, [apiUrl, axiosInstance, canUseLocalStorage, setTokensAndSave])

  useEffect(() => {
    const savedRefreshToken = canUseLocalStorage && localStorage.getItem(tokenStorageKey)
    const apiClient = new ImployApiClient({}, apiUrl, axiosInstance)

    setImployApiClient(apiClient)

    if (savedRefreshToken) {
      apiClient.getRefreshToken({ refresh: savedRefreshToken })
        .then(({ access_token, refresh_token }) => setTokensAndSave(access_token, refresh_token))
        .catch(console.error)
    }
    
    setIsLoadingUser(false)

  // TODO figure out why having setTokensAndSave triggers an infinite loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, axiosInstance, canUseLocalStorage])

  const selectWallet = async () => {
    if (onboard && !isReady) {
      let walletReady = !!wallet
      if (!walletReady) {
        walletReady = await onboard.walletSelect()
      }
      walletReady && (await checkIsReady())
    }
  }

  const resetAndSelectWallet = async () => {
    if (onboard) {
      const walletReady = await onboard.walletSelect()
      walletReady && (await checkIsReady())
    }
  }

  const web3Login = async () => {
    if (!provider) return Promise.reject("No wallet is selected")

    if (!isReady) {
      const connected = await checkIsReady()
      if (!connected) return Promise.reject("You need to allow the connection")
    }

    try {
      const { token } = await imployApiClient.getWeb3Token()

      if (token) {
        const signature = await signMessage(token, provider.getSigner())
        const addresses = await provider.listAccounts()
        const {
          access_token,
          refresh_token
        } = await imployApiClient.postWeb3Token({
          signature: signature,
          token: token,
          public_address: addresses[0]
        })
        setTokensAndSave(access_token, refresh_token)
        setReturningUser()
        return Promise.resolve()
      }
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const thresholdKeyLogin = async (
    signature: string,
    token: string,
    publicAddress: string,
  ) => {
    try {
      const {
        access_token,
        refresh_token,
      } = await imployApiClient.postWeb3Token({
        signature: signature,
        token: token,
        public_address: publicAddress,
      })
      setTokensAndSave(access_token, refresh_token)
      setReturningUser()
      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  }

  useEffect(() => {
    if (refreshToken && refreshToken.token) {
      try {
        const decoded = jwtDecode<{ mps?: string; exp: number; uuid: string }>(
          refreshToken.token
        )
        console.log(decoded)
        setDecodedRefreshToken(decoded)
      } catch (error) {
        console.error("Error decoding access token")
      }
    }
  }, [refreshToken])

  useEffect(() => {
    if (accessToken && accessToken.token && imployApiClient) {
      imployApiClient?.setToken(accessToken.token)
      const decodedAccessToken = jwtDecode<{ perm: { secured?: string } }>(
        accessToken.token
      )
      console.log(decodedAccessToken)
      if (decodedAccessToken.perm.secured === "true") {
        setSecured(true)
      } else {
        setSecured(false)
      }
    }
  }, [accessToken, imployApiClient])

  const isLoggedIn = () => {
    if (isLoadingUser) {
      return undefined
    }
    if (!decodedRefreshToken) {
      return false
    } else {
      try {
        const isLoggedIn = Date.now() / 1000 < decodedRefreshToken.exp
        return isLoggedIn
      } catch (error) {
        return false
      }
    }
  }

  const getProviderUrl = async (provider: Provider) => {
    try {
      const { url } = await imployApiClient.getOauth2Provider(provider)
      return Promise.resolve(url)
    } catch {
      return Promise.reject("There was an error logging in")
    }
  }

  const loginWithGithub = async (code: string, state: string) => {
    try {
      const {
        access_token,
        refresh_token
      } = await imployApiClient.postOauth2CodeGithub(code, state)
      setTokensAndSave(access_token, refresh_token)
      setReturningUser()
      return Promise.resolve()
    } catch {
      return Promise.reject("There was an error logging in")
    }
  }

  const loginWithGoogle = async (
    code: string,
    state: string,
    scope: string | undefined,
    authUser: string | undefined,
    hd: string | undefined,
    prompt: string | undefined
  ) => {
    try {
      const {
        access_token,
        refresh_token
      } = await imployApiClient.postOauth2CodeGoogle(
        code,
        state,
        scope,
        authUser,
        hd,
        prompt
      )

      setTokensAndSave(access_token, refresh_token)
      setReturningUser()
      return Promise.resolve()
    } catch (err) {
      return Promise.reject("There was an error logging in")
    }
  }

  const loginWithFacebook = async (code: string, state: string) => {
    try {
      const {
        access_token,
        refresh_token
      } = await imployApiClient.postOauth2CodeFacebook(code, state)

      setTokensAndSave(access_token, refresh_token)
      setReturningUser()
      return Promise.resolve()
    } catch (err) {
      return Promise.reject("There was an error logging in")
    }
  }

  const logout = () => {
    setAccessToken(undefined)
    setRefreshToken(undefined)
    setDecodedRefreshToken(undefined)
    canUseLocalStorage && localStorage.removeItem(tokenStorageKey)
  }

  const secureAccount = async (masterPassword: string) => {
    try {
      if (decodedRefreshToken && refreshToken) {
        const uuidArray = new TextEncoder().encode(decodedRefreshToken.uuid)
        const encryptedUuid = await encryptFile(uuidArray, masterPassword)
        const encryptedUuidString = Buffer.from(encryptedUuid).toString(
          "base64"
        )
        await imployApiClient.secure({
          mps: encryptedUuidString
        })

        const {
          access_token,
          refresh_token
        } = await imployApiClient.getRefreshToken({
          refresh: refreshToken.token
        })

        setTokensAndSave(access_token, refresh_token)
        return true
      } else {
        return false
      }
    } catch (error) {
      return false
    }
  }

  const secureThresholdKeyAccount = async (encryptedKey: string) => {
    try {
      if (decodedRefreshToken && refreshToken) {
        await imployApiClient.secure({
          mps: encryptedKey,
        })

        const {
          access_token,
          refresh_token,
        } = await imployApiClient.getRefreshToken({
          refresh: refreshToken.token,
        })

        setTokensAndSave(access_token, refresh_token)
        return true
      } else {
        return false
      }
    } catch (error) {
      return false
    }
  }

  const validateMasterPassword = async (
    candidatePassword: string
  ): Promise<boolean> => {
    if (!decodedRefreshToken || !decodedRefreshToken.mps) return false
    try {
      const toDecryptArray = Buffer.from(decodedRefreshToken.mps, "base64")
      const decrypted = await decryptFile(toDecryptArray, candidatePassword)
      if (decrypted) {
        const decryptedUuid = new TextDecoder().decode(decrypted)
        return decodedRefreshToken.uuid === decryptedUuid
      } else {
        return false
      }
    } catch (error) {
      return false
    }
  }

  return (
    <ImployApiContext.Provider
      value={{
        imployApiClient,
        isLoggedIn: isLoggedIn(),
        secured,
        isReturningUser: isReturningUser,
        secureAccount,
        web3Login,
        loginWithGithub,
        loginWithGoogle,
        loginWithFacebook,
        selectWallet,
        resetAndSelectWallet,
        getProviderUrl,
        logout,
        validateMasterPassword,
        thresholdKeyLogin,
        secureThresholdKeyAccount,
        encrypedEncryptionKey: decodedRefreshToken?.mps,
      }}
    >
      {children}
    </ImployApiContext.Provider>
  )
}

const useImployApi = () => {
  const context = React.useContext(ImployApiContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider")
  }
  return context
}

export { ImployApiProvider, useImployApi }
