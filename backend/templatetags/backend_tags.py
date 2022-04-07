from django.conf import settings
from django import template
from backend.tasks import getRowInPage

register = template.Library()


"""
@register.filter
def getStatus(value):
    if value:
        return '<span class="badge badge-success">Yes</span>'
    elif value is False:
        return '<span class="badge badge-danger">No</span>'
    else:
        return '<span class="badge badge-secondary">Inactive</span>'
"""


@register.filter
def getStatusMatch(value):
    if value is 0:
        return '<span class="badge badge-info">PENDING</span>'
    elif value is 1:
        return '<span class="badge badge-warning">INPROCESS</span>'
    elif value is 2:
        return '<span class="badge badge-danger">RETRY</span>'
    elif value is 3:
        return '<span class="badge badge-danger">FAILURE</span>'
    elif value is 4:
        return '<span class="badge badge-success">SUCCESS</span>'
    else:
        return '<span class="badge badge-secondary">NONE</span>'

@register.filter
def getResultMatch(value):
    if value is 3:
        return '<span class="badge badge-danger">Pending</span>'

@register.filter
def getIDFollowPage(value, pageID):
    return int(value) + ((int(pageID) -1) * getRowInPage())

@register.filter
def isConditionTag(value, Tag):
    return Tag if not value else ""
