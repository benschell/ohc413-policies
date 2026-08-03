---
type: form
title: Visitor Waiver of Liability and Emergency Contact Form
units:
  - name: Pack 413
    email: pack-leadership@ohc413.org
    vars:
      presence: >-
        A parent or legal guardian must remain on site for the entire visit and stays
        responsible for the visiting youth.
      presence_ack: >-
        I will remain on site for the duration of the visit and remain responsible for my
        child while we are attending.
  - name: Troop 413
    email: troop-leadership@ohc413.org
    vars:
      presence: >-
        A parent or legal guardian is welcome to stay for the visit but is not required to
        remain on site.
      presence_ack: ""
address: 228 W Dalton Street, King, NC 27021
revision: 2026-07-26
fields:
  - heading: Visiting Youth
  - label: Youth Name
    width: 0.62
  - label: Date of Birth
    width: 0.34
    type: date
  - label: Age
    width: 0.20
  - label: Grade
    width: 0.22
  - label: School
    width: 0.54
  - label: Parent / Guardian Name
    width: 0.62
  - label: Relationship to Youth
    width: 0.34
  - label: Address
    width: 1.0
  - label: City
    width: 0.44
  - label: State
    width: 0.22
  - label: Zip
    width: 0.30
  - label: Phone
    width: 0.46
  - label: Email
    width: 0.50
  - heading: Emergency Contact
  - label: Name
    width: 0.44
  - label: Relationship
    width: 0.24
  - label: Phone
    width: 0.28
  - heading: Health Information
  - label: Allergies (food, medication, insect, other)
    width: 1.0
    height: 22pt
    stacked: true
  - label: Medications, conditions, or restrictions our leaders should know about
    width: 1.0
    height: 22pt
    stacked: true
  - heading: Photo Consent
  - label: >-
      I consent to photographs and video of my child taken during this visit being used by
      the unit as described in its Photo Release Form. Optional — leave blank to decline.
    type: checkbox
    width: 1.0
  - heading: Signature
  - label: Parent / Guardian Printed Name
    width: 0.62
  - label: Date
    width: 0.34
    type: date
  - label: Parent / Guardian Signature
    width: 1.0
    type: signature
  - heading: Unit Use Only
  - label: First Visit Date
    width: 0.35
    type: date
  - label: "{{subunit}} Visited"
    width: 0.29
  - label: Leader's Initials
    width: 0.32
  - label: Second Visit Date
    width: 0.35
    type: date
  - label: "{{subunit}} Visited"
    width: 0.29
  - label: Leader's Initials
    width: 0.32
---

{{unit}} welcomes prospective Scouts and their families to try our program before joining.
Under our Visitor Policy, a visiting youth may attend up to **two (2)** {{unit}} meetings or
activities for the purpose of trying out the program. After the second visit, registration
materials must be submitted to continue participating.

A parent or legal guardian must complete this form and check in with a unit leader **before**
the visiting youth takes part in any activity. {{presence}}

{{fields:visiting-youth}}

{{fields:emergency-contact}}

{{fields:health-information}}

## Informed Consent, Release, and Authorization

I understand that participation in Scouting activities involves the risk of personal injury,
including death, due to the physical, mental, and emotional challenges in the activities
offered. I understand that participation is entirely voluntary and requires participants to
follow instructions and abide by all applicable rules and standards of conduct.

In case of an emergency involving my child, I understand that efforts will be made to contact
me. In the event I cannot be reached, permission is hereby given to the medical provider to
secure proper treatment, including hospitalization, anesthesia, surgery, or injections of
medication for my child. Medical providers are authorized to disclose protected health
information to the adult in charge and to any physician or health care provider involved in
providing care to my child. I understand that I am responsible for any medical costs incurred.

With appreciation of the dangers and risks associated with the program and its activities,
including preparation for and transportation to and from the activity, on my own behalf and on
behalf of my child, I hereby fully and completely release and waive any and all claims for
personal injury, death, or loss that may arise against {{org}}, King Moravian Church (our
chartered organization), Old Hickory Council, Scouting America, and all of their employees,
volunteers, and related parties.

I confirm that my child and I will follow all {{unit}} rules, safety guidelines, and Scouting
America's Youth Protection policies while attending, and that I have read the visitor terms
above. {{presence_ack}}

{{fields:photo-consent}}

{{fields:signature}}

A unit leader initials each visit below to confirm this signed waiver was on hand before the
visiting youth took part. After the second visit, registration materials are required.

{{fields:unit-use-only}}
