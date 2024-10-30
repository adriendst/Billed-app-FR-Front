/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import { log } from 'console'
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";


jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.className).toBe('active-icon')
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
  describe("When I am on Bills Page and I click on Eye Icon", () => {
    test("Then modal bill should appear", () => {

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      document.body.innerHTML = BillsUI({ data: bills })
      const dashboardBill = new Bills({
        document, onNavigate, store: null, bills: bills, localStorage: window.localStorage
      })
      
      $.fn.modal = jest.fn();

      const iconEye = screen.getAllByTestId("icon-eye")[0]
      const handleShowModal = jest.fn((e) => dashboardBill.handleClickIconEye(iconEye))

      iconEye.addEventListener('click', handleShowModal)
      fireEvent.click(iconEye)
      expect(handleShowModal).toHaveBeenCalled()

    })
  })

})


// test d'intégration GET
describe("Given I am a user connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("fetches bills from mock API GET", async () => {
      await window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      const contentType = await screen.getByText("Type")
      expect(contentType).toBeTruthy()
      const contentName = await screen.getByText("Nom")
      expect(contentName).toBeTruthy()
      const contentDate = await screen.getByText("Date")
      expect(contentDate).toBeTruthy()
      const contentAmount = await screen.getByText("Montant")
      expect(contentAmount).toBeTruthy()
      const contentStatus = await screen.getByText("Statut")
      expect(contentStatus).toBeTruthy()
      const contentActions = await screen.getByText("Actions")
      expect(contentActions).toBeTruthy()

    })
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "e@e"
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })
      test("fetches bills from an API and fails with 404 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })
      test("fetches messages from an API and fails with 500 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })

        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })

  })
})